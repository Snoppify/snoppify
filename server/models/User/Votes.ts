export interface Votes {
  received: { [userId: string]: number };
  given: { [userId: string]: number };
  receivedTotal: number;
  givenTotal: number;
}
