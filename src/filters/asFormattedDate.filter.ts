import moment from "moment";

export function asFormattedDate (companyIncDate: string): string {
    return moment(companyIncDate).format("DD MMM YYYY");
}
