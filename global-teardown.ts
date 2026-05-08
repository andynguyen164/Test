import { finalizeReport } from './utils/reporter';

export default async function globalTeardown() {
  finalizeReport();
}
