import { Request, Response, Express } from 'express'

export class API {
  // Properties
  app: Express
  // Constructor
  constructor(app: Express) {
    this.app = app
    this.app.get('/hello', this.sayHello)
  }
  // Methods
  private sayHello(req: Request, res: Response) {
    res.send('Hello There!')
  }
}
