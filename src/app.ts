import express from "express";
import bodyParser from "body-parser";
import helmet from "helmet";
import { GTFSFlexValidator } from "./controller/gtfs-flex-validator";
import { IController } from "./controller/interface/IController";

class App {
    public app: express.Application;
    public port: number;
    private validator: GTFSFlexValidator;

    constructor(controllers: IController[], port: number) {
        this.app = express();
        this.port = port;

        this.initializeMiddlewares();
        this.initializeControllers(controllers);
        this.validator = new GTFSFlexValidator();
    }

    private initializeMiddlewares() {
        this.app.use(helmet());
        this.app.use(bodyParser.json());
    }

    private initializeControllers(controllers: IController[]) {
        controllers.forEach((controller) => {
            this.app.use('/', controller.router);
        });
    }

    public listen() {
        this.app.listen(this.port, () => {
            console.log(`App listening on the port ${this.port}`);
        });
    }
}

export default App;