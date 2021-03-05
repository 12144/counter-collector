export interface CounterData {
    user_id: string;
    item_id: string;
    parent_id: string;
    requests: number;
    investigations: number;
    no_license: number;
    limit_exceeded: number;
}
export declare function uploadData(data: CounterData[]): Promise<any>;
