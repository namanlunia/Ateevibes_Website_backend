import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InventoryService } from "./inventory.service";

@Injectable()
export class InventoryCron {
  private readonly logger = new Logger(InventoryCron.name);

  constructor(private readonly inventoryService: InventoryService) {}

  @Cron("*/5 * * * *")
  async handleExpiredReservationsCron() {
    try {
      const result = await this.inventoryService.releaseExpiredReservations();
      if (result && result.released > 0) {
        this.logger.log(`Inventory cron auto-released ${result.released} expired reservations.`);
      }
    } catch (err: any) {
      this.logger.error(`Failed to release expired reservations: ${err.message}`, err.stack);
    }
  }
}
