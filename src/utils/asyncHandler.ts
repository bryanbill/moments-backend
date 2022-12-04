const asyncHandler = (fn: Function) => (req: Request, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next)
}