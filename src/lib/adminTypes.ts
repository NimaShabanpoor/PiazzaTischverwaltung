import type {
  GroupRequestStatus,
  ReservationSource,
  ReservationStatus,
  TableStatus,
} from "@prisma/client";

export type GroupRequestDTO = {
  id: string;
  start: Date;
  end: Date;
  partySize: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  note: string | null;
  status: GroupRequestStatus;
  createdAt: Date;
};
import type { DisplayStatus } from "@/components/TableGraphic";

export type ReservationDTO = {
  id: string;
  confirmationCode: string;
  tableId: string;
  start: Date;
  end: Date;
  partySize: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  status: ReservationStatus;
  source: ReservationSource;
  note: string | null;
};

export type TableDTO = {
  id: string;
  number: number;
  seats: number;
  active: boolean;
  status: TableStatus;
  lockNote: string | null;
  busyFrom: Date | null;
  busyUntil: Date | null;
};

export type TableOverviewDTO = TableDTO & {
  displayStatus: DisplayStatus;
  todaysReservations: ReservationDTO[];
};

export type ReservationWithTableDTO = ReservationDTO & { table: TableDTO };
