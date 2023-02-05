export const remove_propeties = (payload: any, properties: string[]) => {
    for(const prop of properties) {
        delete payload[prop];
    }
    return payload
}