import type { CanhBao } from "../parser";
import type { ParseWarning } from "../../types/contract";

type ContractWarningCode = ParseWarning["code"];

/**
 * Contract hien chi co ma cho hai canh bao metadata ma parser co the tao chinh xac.
 * Cac chan doan noi bo khac van duoc luu day du o documents.parse_warnings.
 */
export function toContractWarnings(warnings: CanhBao[]): ParseWarning[] {
  return warnings.flatMap((warning): ParseWarning[] => {
    let code: ContractWarningCode | null = null;
    if (warning.loai === "thieu_metadata" && warning.thong_diep.includes('"so_hieu"')) {
      code = "THIEU_SO_HIEU";
    } else if (
      warning.loai === "thieu_metadata" &&
      warning.thong_diep.includes('"loai_van_ban"')
    ) {
      code = "KHONG_XAC_DINH_LOAI";
    }

    return code
      ? [
          {
            code,
            message: warning.thong_diep,
            ...(warning.dong === undefined ? {} : { line: warning.dong }),
          },
        ]
      : [];
  });
}
