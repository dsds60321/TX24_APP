package kr.tx24.fc.enums;

import kr.tx24.lib.lang.CommonUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public enum TxResultCode {


	SUCCESS("TX000", "성공"),
	INVALID_REQUEST("TX001", "잘못된 요청입니다."),
	NO_CONTENTS("TX204", "요청한 데이터를 찾을 수 없습니다."),
	SECURITY_VIOLATION("TX403", "보안 규정에 위배되는 접근입니다."),
	INTERNAL_ERROR("TX500", "시스템 오류가 발생했습니다.");

	private static final Logger logger = LoggerFactory.getLogger(TxResultCode.class);

	private final String code;
	private final String defaultMessage;

	TxResultCode(String code, String defaultMessage) {
		this.code = code;
		this.defaultMessage = defaultMessage;
	}

	public String getCode() {
		return code;
	}

	public String getDefaultMessage() {
		return defaultMessage;
	}

	/**
	 * 응답코드 반환 메서드
	 */
	public int getNumericCode() {
		if (CommonUtils.isEmpty(code)) {
			return 200;
		}

		String numericPart = code.startsWith("TX") ? code.substring(2) : code;
		try {
			return Integer.parseInt(numericPart);
		} catch (Exception ex) {
			logger.warn("TxResultCode | getNumericCode | {}", CommonUtils.getExceptionMessage(ex, 1000));
			return 200;
		}
	}
}
