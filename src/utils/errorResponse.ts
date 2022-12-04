export class ErrorResponse extends Error {
    statusCode: number
    messageWithField: any

    constructor(message: string, statusCode: number, messageWithField = null || {}) {
        super(message)
        this.statusCode = statusCode
        this.messageWithField = messageWithField
    }
}