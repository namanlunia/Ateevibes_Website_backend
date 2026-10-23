import { Module } from "@nestjs/common";
import { InventoryService } from "./inventory.service";
import { InventoryController } from "./inventory.controller";
import { InventoryCron } from "./inventory.cron";

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, InventoryCron],
  exports: [InventoryService],
})
export class InventoryModule {}
