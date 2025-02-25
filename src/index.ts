import * as dotenv from 'dotenv';
dotenv.config();

import { CronJob } from 'cron';
import { fork } from 'child_process';
import { Database } from './repositories/Database';
import { DateFormat } from './utils/DateFormat';
import createFileSystemController from './useCases/FileSystem';
import DatabaseBackup from './repositories/DatabaseBackup';

// Stop all cron jobs
process.on('SIGINT', () => {
    initGetOrders.stop();
    initOrdersUpdate.stop();
    initBackupRoutine.stop();
});

// Starts order taking functions
const initGetOrders = new CronJob('0 */30 * * * *', async () => {
    const ENVIRONMENT = process.env.NODE_ENV.trimEnd().toLowerCase();
    const child = fork(__dirname + `/initOrdersGeneration.${ENVIRONMENT === "prod" ? "js" : "ts"}`, ['normal']);
    const db = new Database().createConnection();
    
    const lastTimeInDb = await db.select('lastTimeRequest').from('requestStatus').build();
    const { lastTimeRequest } = lastTimeInDb[0];
    
    const actualTime = new Date();
    const actualTimeToRequest = DateFormat.dateFormatToQueryParams(actualTime);
    const lastTime = DateFormat.dateFormatToQueryParams(new Date(lastTimeRequest));
    
    const queryParams = `?f_creationDate=creationDate%3A%5B${lastTime}%20TO%20${actualTimeToRequest}%5D&per_page=100`;

    child.send(queryParams);

    child.on('exit', async (status: number) => {
        if(Boolean(status))
        {
            await db.update('requestStatus').set({
                lastTimeRequest: `'${actualTime.toISOString()}'`,
                requestStatus: 1
            }).where("id_status=1").build();
        }
        else
        {
            await db.update('requestStatus').set({
                requestStatus: 0
            }).where("id_status=1").build();
        }
        console.log('Pedidos baixados');
    });
}, null, true, 'America/Sao_Paulo');

// Starts orders update functions
const initOrdersUpdate = new CronJob('0 */20 * * * *', async () => {
    const environment = process.env.NODE_ENV.trimEnd().toLowerCase();
    const child = fork(__dirname + `/initUpdateOrders.${environment === "prod" ? "js" : "ts"}`, ['normal']);

    child.on('exit', async (err: number | Error) => {
        
        let message: string;
        const data = await createFileSystemController.handle({
            filePath: 'updateStatus.log',
            methodName: 'read'
        })
        .then(resp => resp)
        .catch(() => "");

        if(err instanceof Error)
        {
            message = data + '\r\nOrders have not been updated: ' + err + " " + new Date();
        }
        else
        {
            if(!Boolean(err))
            {   
                message = data + '\r\nOrders have not been updated: ' + new Date();
            }
        }
        await createFileSystemController.handle({
            filePath: 'updateStatus.log',
            methodName: 'write',
            errorMessage: message
        });
        console.log('Pedidos atualizados');
    })
}, null, true, 'America/Sao_Paulo');

// Starts the database backup routine
const initBackupRoutine = new CronJob('00 00 00 * * *', async () => {
    const databaseBackup = new DatabaseBackup().createConnection();
    const envToUse = process.env.NODE_ENV.toUpperCase().trimEnd();
    const response = await databaseBackup
        .createBackup({
            database: process.env[`DB_NAME_${envToUse}`],
            localToSave: process.env[`DB_BACKUP_PATH_${envToUse}`],
            backupFileName: process.env[`DB_NAME_${envToUse}`] + "_backup"
        })
        .build();
    
    if(response instanceof Error)
    {
        const data = await createFileSystemController.handle({
            filePath: 'backupStatus.log',
            methodName: 'read'
        })
        .then(resp => resp)
        .catch(() => "");

        await createFileSystemController.handle({
            filePath: 'backupStatus.log',
            methodName: 'write',
            errorMessage: data + "\r\n" + response.toString()
        });
    }
    console.log("Backup concluído");
}, null, true, 'America/Sao_Paulo');