import * as urlData from '../../vtex_authData.config';
import createFileSystemController from '../useCases/FileSystem';
import { DateFormat } from './DateFormat';

export class GetOptions
{
    static lastTimeRequest: any;
    
    constructor()
    {
        this.setLastTimeRequest();
    }

    urlOptions()
    {
        let finalTime = DateFormat.dateFormatToQueryParams(DateFormat.getActualTime());
        let initialTime = DateFormat.dateFormatToQueryParams(GetOptions.lastTimeRequest);

        return {
            url: `https://${urlData.vtexAccountName}.vtexcommercestable.com.br/api/oms/pvt/orders`,
            queryParams: `?f_creationDate=creationDate%3A%5B${initialTime}%20TO%20${finalTime}%5D&per_page=100`,
            options: {
                method: 'GET',
                headers: {
                    Accept: "application/json",
                    "Content-type": "application/json",
                    "X-VTEX-API-AppKey": urlData['X-VTEX-API-AppKey'],
                    "X-VTEX-API-AppToken": urlData['X-VTEX-API-AppToken']
                }
            }
        }
    }

    async setLastTimeRequest()
    {
        let lastStatus = await createFileSystemController.handle({
            filePath: 'lastRequestStatus.json',
            methodName: 'read'
        });

        const { lastRequest } = JSON.parse(lastStatus); 
        GetOptions.lastTimeRequest = lastRequest;
    }

    static getLastTimeRequest()
    {
        return GetOptions.lastTimeRequest;
    }
}