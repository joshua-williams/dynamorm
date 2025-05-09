import 'reflect-metadata';
import { DynamoRMOptions, ModelOptions, TableOptions } from "./types";
import { AttributeType } from "./types";
export declare function table(options: TableOptions): (constructor: any) => void;
export declare function model(options: ModelOptions): (constructor: any) => void;
export declare function dynamorm(options: DynamoRMOptions): (constructor: any) => void;
export declare function attribute(type?: AttributeType, required?: boolean): (constructor: any, key: any) => void;
export declare function Entity(constructor: any): void;
//# sourceMappingURL=decorators.d.ts.map