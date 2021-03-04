import fetch from "node-fetch";
import { IRequestOptions } from './interfaces/IRequestOptions';

interface IRequestDatas
{
    url: string;
    queryParams?: "" | string;
    options: IRequestOptions;
    timeout: number;
}

/**
 * @classdesc Create all requests to API vtex
 */
export class Requests
{
    /**
     * 
     * @param param0 an object with all url configurations
     * @returns a resolve or reject data
     */
    async makeRequest({ url, queryParams, options, timeout }: IRequestDatas): Promise<void>
    {
        return Promise.race([
            this.get(url + queryParams, options),
            this.timeDelay(url, timeout)
        ]);
    }

    /**
     * 
     * @param url
     * @param options request headers
     * @returns An object with orders detail
     */
    async get(url: string, options: IRequestOptions): Promise<void>
    {
        return new Promise((resolve, reject) => {
            fetch(url, options)
                .then(resp => resolve(resp.json()))
                    .catch(() => reject(new Error(`Error at-${url}`)));
        })
    }

    timeDelay(url: string, timeout: number): Promise<void>
    {
        return new Promise((resolve, reject) => {
            setTimeout(this.errorTimeout(reject, url), timeout);
        });
    }

    /**
     * 
     * @param reject reject function
     * @param url
     * @return an Error when the api returns spent more than timeout defined
     */
    errorTimeout = (reject: (err: Error) => any, url: string) => () => reject(new Error(`Timeout at-${url}`));
}