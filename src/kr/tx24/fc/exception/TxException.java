package kr.tx24.fc.exception;

import kr.tx24.fc.enums.TxResultCode;

public class TxException extends RuntimeException {
	private static final long serialVersionUID = 1L;

	private final TxResultCode resultCode;
	private final String errorMessage;

	public TxException(TxResultCode resultCode) {
		this(resultCode, resultCode.getDefaultMessage(), null);
	}

	public TxException(TxResultCode resultCode, String message) {
		this(resultCode, message, null);
	}

	public TxException(TxResultCode resultCode, String message, Throwable cause) {
		super(message, cause);
		this.resultCode = resultCode;
		this.errorMessage = message;
	}

	public TxResultCode getResultCode() {
		return resultCode;
	}

	public String getErrorMessage() {
		return errorMessage;
	}
}
