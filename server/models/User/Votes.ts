export interface Votes {
  received: { [userId: string]: number };
  given: { [userId: string]: number };
  receivedTotal: 0;
  givenTotal: 0;
}
