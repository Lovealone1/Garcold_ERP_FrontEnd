/** Keep the API's exact status value, but never offer purchase states for sales. */
export function saleStatusOptions(statuses: string[]): string[] {
    return statuses.filter(status => /^ventas?\b/i.test(status.trim()));
}
