import { Sdk } from "@lumeweb/portal-sdk";
import { RefineProps } from "@refinedev/core";

import { Framework } from "../api/framework";

export interface BaseCapability<
  TType extends string = string,
  TID extends string = string,
> {
  destroy(framework: Framework): Promise<void>;
  readonly id: TID;

  initialize(framework: Framework): Promise<void>;
  readonly metadata: {
    description: string;
    name: string;
    provider: string;
  };
  readonly status: "active" | "error" | "inactive";
  readonly type: TType;
  readonly version: string;
  /**
   * Array of capability IDs that must be initialized before this one
   */
  dependencies?: string[];
}

export interface RefineConfigCapability
  extends BaseCapability<"core:refine-config"> {
  getConfig(existing?: Partial<RefineProps>): Partial<RefineProps>;
}

export interface SdkCapability extends BaseCapability<"core:sdk"> {
  getSdk(): Sdk;
}
