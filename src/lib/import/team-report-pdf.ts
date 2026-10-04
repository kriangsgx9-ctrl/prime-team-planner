// Line-by-line port of the offline app's FWD "Sale Performance" team-report
// PDF parser (PRIMETEAM_Goal_Setting_Planner.html, parseTeamReportPdf and
// helpers). One block per agent with a fixed row-label sequence:
//   APE -> (agent code) -> FYP -> FYC -> NBC -> NBCFY -> NBCSY -> NBCTY -> สถานะ -> Case
// each row holding one value per month starting from January. The agent code
// isn't always in the same slot (sometimes before FYP, sometimes inside the
// FYP row itself) and long Thai names can get split around it, so this
// anchors on the row-label sequence (very reliable) and stays lenient about
// where the code/name fragments land around it.

const PDF_ROLE_TOKENS = new Set(["VP", "AGP", "SDM", "DM", "AM", "UM", "AL", "IC"]);

function pdfIsAmt(t: string): boolean {
  return t === "-" || /^-?[\d,]+\.\d+$/.test(t);
}
function pdfIsCode(t: string): boolean {
  return /^\d{4,8}$/.test(t);
}
function pdfAmtToNum(t: string): number {
  return t === "-" ? 0 : parseFloat(t.replace(/,/g, "")) || 0;
}

function pdfTakeAmounts(tokens: string[], i: number, stopLabel: string) {
  const vals: string[] = [];
  const strays: string[] = [];
  while (i < tokens.length && tokens[i] !== stopLabel) {
    if (pdfIsAmt(tokens[i])) vals.push(tokens[i]);
    else strays.push(tokens[i]);
    i++;
    if (vals.length > 20) break;
  }
  return { vals, strays, i };
}

function pdfTakeAmountsUntilAny(tokens: string[], i: number, stopSet: Set<string>) {
  const vals: string[] = [];
  const strays: string[] = [];
  while (i < tokens.length && !stopSet.has(tokens[i])) {
    if (pdfIsAmt(tokens[i])) vals.push(tokens[i]);
    else strays.push(tokens[i]);
    i++;
    if (vals.length > 20) break;
  }
  return { vals, strays, i };
}

const THAI_MONTH_ABBR: Record<string, number> = {
  "ม.ค.": 1, "ก.พ.": 2, "มี.ค.": 3, "เม.ย.": 4, "พ.ค.": 5, "มิ.ย.": 6,
  "ก.ค.": 7, "ส.ค.": 8, "ก.ย.": 9, "ต.ค.": 10, "พ.ย.": 11, "ธ.ค.": 12,
  "ม.ค": 1, "ก.พ": 2, "มี.ค": 3, "เม.ย": 4, "พ.ค": 5, "มิ.ย": 6,
  "ก.ค": 7, "ส.ค": 8, "ก.ย": 9, "ต.ค": 10, "พ.ย": 11, "ธ.ค": 12,
};

const THAI_MONTH_FULL: Record<string, number> = {
  มกราคม: 1, กุมภาพันธ์: 2, มีนาคม: 3, เมษายน: 4, พฤษภาคม: 5, มิถุนายน: 6,
  กรกฎาคม: 7, สิงหาคม: 8, กันยายน: 9, ตุลาคม: 10, พฤศจิกายน: 11, ธันวาคม: 12,
};

function detectReportMonths(text: string): { months: number[] | null; hasYTD: boolean } {
  const tokens = text.split(/\s+/).filter(Boolean);
  const idx = tokens.findIndex((t) => t === "ผลงาน");
  if (idx < 0) return { months: null, hasYTD: false };
  const months: number[] = [];
  let i = idx + 1;
  while (i < tokens.length && THAI_MONTH_ABBR[tokens[i]] !== undefined) {
    months.push(THAI_MONTH_ABBR[tokens[i]]);
    i++;
  }
  const hasYTD = tokens[i] === "YTD";
  return { months: months.length ? months : null, hasYTD };
}

export function detectReportPeriod(text: string): { month: number; yearBE: number } | null {
  const m = text.match(/PERFORMANCE\s+([ก-๙]+)\s+(\d{4})/);
  if (m && THAI_MONTH_FULL[m[1]]) {
    return { month: THAI_MONTH_FULL[m[1]], yearBE: parseInt(m[2]) };
  }
  return null;
}

export type ParsedAgentBlock = {
  role: string | null;
  name: string;
  agentCode: string | null;
  status: string | null;
  months: number[];
  fyp: number[];
  fyc: number[];
  nbc: number[];
  nbcfy: number[];
  nbcsy: number[];
  nbcty: number[];
  caseCount: number[];
};

type TeamTotalBlock = { months: number[]; fyp: number[]; fyc: number[]; nbcfy: number[] } | null;

export type ParsedTeamReport = { agents: ParsedAgentBlock[]; teamTotal: TeamTotalBlock };

function parseTeamTotalBlock(tokens: string[], headerMonths: number[] | null, hasYTD: boolean): TeamTotalBlock {
  const idx = tokens.indexOf("ผลงานทีมรวม");
  if (idx < 0) return null;
  let i = idx + 1;
  function take(stopLabel: string) {
    const vals: string[] = [];
    while (i < tokens.length && tokens[i] !== stopLabel) {
      if (pdfIsAmt(tokens[i])) vals.push(tokens[i]);
      i++;
      if (vals.length > 20) break;
    }
    return vals;
  }
  if (tokens[i] !== "APE") return null;
  i++;
  take("FYP");
  if (tokens[i] !== "FYP") return null;
  i++;
  let fyp = take("FYC");
  if (tokens[i] !== "FYC") return null;
  i++;
  let fyc = take("NBC");
  if (tokens[i] !== "NBC") return null;
  i++;
  take("NBCFY");
  if (tokens[i] !== "NBCFY") return null;
  i++;
  let nbcfy = take("NBCSY");
  if (hasYTD && fyp.length > 1) {
    fyp = fyp.slice(0, -1);
    fyc = fyc.slice(0, -1);
    nbcfy = nbcfy.slice(0, -1);
  }
  const monthsForRow = headerMonths && headerMonths.length >= fyp.length ? headerMonths.slice(0, fyp.length) : Array.from({ length: fyp.length }, (_, idx2) => idx2 + 1);
  return { months: monthsForRow, fyp: fyp.map(pdfAmtToNum), fyc: fyc.map(pdfAmtToNum), nbcfy: nbcfy.map(pdfAmtToNum) };
}

export function parseTeamReportPdf(text: string): ParsedTeamReport {
  const tokens = text.split(/\s+/).filter(Boolean);
  const fypIdxs: number[] = [];
  tokens.forEach((t, idx) => {
    if (t === "FYP") fypIdxs.push(idx);
  });
  const stopAfterCase = new Set<string>(["FYP", "ผลงานทีมรวม", ...PDF_ROLE_TOKENS]);
  const headerInfo = detectReportMonths(text);
  const headerMonths = headerInfo.months;
  const hasYTD = headerInfo.hasYTD;

  const agents: ParsedAgentBlock[] = [];
  for (let k = 0; k < fypIdxs.length; k++) {
    let i = fypIdxs[k] + 1;
    let r;
    let allStrays: string[] = [];
    r = pdfTakeAmounts(tokens, i, "FYC");
    const fyp = r.vals;
    i = r.i;
    allStrays = allStrays.concat(r.strays);
    if (tokens[i] !== "FYC") continue;
    i++;
    r = pdfTakeAmounts(tokens, i, "NBC");
    const fyc = r.vals;
    i = r.i;
    allStrays = allStrays.concat(r.strays);
    if (tokens[i] !== "NBC") continue;
    i++;
    r = pdfTakeAmounts(tokens, i, "NBCFY");
    const nbc = r.vals;
    i = r.i;
    allStrays = allStrays.concat(r.strays);
    if (tokens[i] !== "NBCFY") continue;
    i++;
    r = pdfTakeAmounts(tokens, i, "NBCSY");
    const nbcfy = r.vals;
    i = r.i;
    allStrays = allStrays.concat(r.strays);
    if (tokens[i] !== "NBCSY") continue;
    i++;
    r = pdfTakeAmounts(tokens, i, "NBCTY");
    const nbcsy = r.vals;
    i = r.i;
    allStrays = allStrays.concat(r.strays);
    if (tokens[i] !== "NBCTY") continue;
    i++;
    r = pdfTakeAmounts(tokens, i, "สถานะ");
    const nbcty = r.vals;
    i = r.i;
    allStrays = allStrays.concat(r.strays);
    if (tokens[i] !== "สถานะ") continue;
    i++;
    const status = tokens[i];
    i++;
    if (tokens[i] !== "Case") continue;
    i++;
    r = pdfTakeAmountsUntilAny(tokens, i, stopAfterCase);
    const caseVals = r.vals.slice(0, fyp.length);
    i = r.i;
    allStrays = allStrays.concat(r.strays);

    let roleIdx = -1;
    for (let b = fypIdxs[k] - 1; b >= Math.max(0, fypIdxs[k] - 25); b--) {
      if (PDF_ROLE_TOKENS.has(tokens[b])) {
        roleIdx = b;
        break;
      }
    }
    let role: string | null = null;
    let name = "";
    let code: string | null = null;
    if (roleIdx >= 0) {
      role = tokens[roleIdx];
      let j = roleIdx + 1;
      if (tokens[j] === "คุณ") j++;
      const nameParts: string[] = [];
      while (j < fypIdxs[k]) {
        const t = tokens[j];
        if (pdfIsCode(t) && !code) code = t;
        else if (t !== "APE" && !pdfIsAmt(t)) nameParts.push(t);
        j++;
      }
      name = nameParts.join(" ").trim();
    }
    if (!code) {
      for (const s of allStrays) {
        if (pdfIsCode(s)) {
          code = s;
          break;
        }
      }
    }

    // The report appends a cumulative "YTD" value after the real months —
    // strip it so it's never mistaken for the next month's data.
    let fypR = fyp, fycR = fyc, nbcR = nbc, nbcfyR = nbcfy, nbcsyR = nbcsy, nbctyR = nbcty, caseR = caseVals;
    if (hasYTD && fypR.length > 1) {
      fypR = fypR.slice(0, -1);
      fycR = fycR.slice(0, -1);
      nbcR = nbcR.slice(0, -1);
      nbcfyR = nbcfyR.slice(0, -1);
      nbcsyR = nbcsyR.slice(0, -1);
      nbctyR = nbctyR.slice(0, -1);
      caseR = caseR.slice(0, -1);
    }

    const monthsForRow = headerMonths && headerMonths.length >= fypR.length ? headerMonths.slice(0, fypR.length) : Array.from({ length: fypR.length }, (_, idx2) => idx2 + 1);

    agents.push({
      role,
      name,
      agentCode: code,
      status,
      months: monthsForRow,
      fyp: fypR.map(pdfAmtToNum),
      fyc: fycR.map(pdfAmtToNum),
      nbc: nbcR.map(pdfAmtToNum),
      nbcfy: nbcfyR.map(pdfAmtToNum),
      nbcsy: nbcsyR.map(pdfAmtToNum),
      nbcty: nbctyR.map(pdfAmtToNum),
      caseCount: caseR.map(pdfAmtToNum),
    });
  }

  const teamTotal = parseTeamTotalBlock(tokens, headerMonths, hasYTD);
  return { agents, teamTotal };
}

export type TeamTotalMismatch = { month: number; sumFyp: number; expFyp: number; sumFyc: number; expFyc: number; sumNbcfy: number; expNbcfy: number };

// Sanity-checks the sum of everyone parsed against the report's own printed
// team total, per month — catches silent parsing errors (a mis-split card, a
// format change) before the numbers get imported. Returns null if the report
// had no "ผลงานทีมรวม" block to compare against.
export function verifyAgainstTeamTotal(report: ParsedTeamReport): TeamTotalMismatch[] | null {
  const teamTotal = report.teamTotal;
  if (!teamTotal) return null;
  const tolerance = 2;
  const mismatches: TeamTotalMismatch[] = [];
  teamTotal.months.forEach((monthNum, idx) => {
    let sumFyp = 0, sumFyc = 0, sumNbcfy = 0;
    report.agents.forEach((a) => {
      const aIdx = a.months ? a.months.indexOf(monthNum) : -1;
      if (aIdx >= 0) {
        sumFyp += a.fyp[aIdx] || 0;
        sumFyc += a.fyc[aIdx] || 0;
        sumNbcfy += a.nbcfy[aIdx] || 0;
      }
    });
    const expFyp = teamTotal.fyp[idx] || 0, expFyc = teamTotal.fyc[idx] || 0, expNbcfy = teamTotal.nbcfy[idx] || 0;
    if (Math.abs(sumFyp - expFyp) > tolerance || Math.abs(sumFyc - expFyc) > tolerance || Math.abs(sumNbcfy - expNbcfy) > tolerance) {
      mismatches.push({ month: monthNum, sumFyp, expFyp, sumFyc, expFyc, sumNbcfy, expNbcfy });
    }
  });
  return mismatches;
}
