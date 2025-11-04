package kr.tx24.fc.bean;

import java.io.Serializable;

import kr.tx24.fc.enums.TxResultCode;

/**
 * 공통 클래스
 */
public class TxResponse<T> implements Serializable {

	public boolean result;
	public String code;
	public String msg;
	public String link;
	public T data;

	public TxResponse() {
	}

	public TxResponse(boolean result, String code, String msg, String link, T data) {
		this.result = result;
		this.code = code;
		this.msg = msg;
		this.link = link;
		this.data = data;
	}

	public static <T> TxResponse<T> ok(T data) {
		return ok(data, TxResultCode.SUCCESS);
	}

	public static <T> TxResponse<T> ok(T data, TxResultCode code) {
		return new TxResponse<>(true, code.getCode(), code.getDefaultMessage(), null, data);
	}

	public static <T> TxResponse<T> fail(String msg) {
		return fail(TxResultCode.INTERNAL_ERROR, msg);
	}

	public static <T> TxResponse<T> fail(TxResultCode code, String msg) {
		return new TxResponse<>(false, code.getCode(), msg, null, null);
	}

	public static <T> TxResponse<T> fail(TxResultCode code) {
		return fail(code, code.getDefaultMessage());
	}

	public static <T> TxResponse<T> fail(String code, String msg) {
		return new TxResponse<>(false, code, msg, null, null);
	}

	public TxResponse<T> result(boolean result) {
		this.result = result;
		return this;
	}

	public TxResponse<T> data(T data) {
		this.data = data;
		return this;
	}

	public TxResponse<T> msg(String msg) {
		this.msg = msg;
		return this;
	}

	public TxResponse<T> code(String code) {
		this.code = code;
		return this;
	}

	public TxResponse<T> link(String link) {
		this.link = link;
		return this;
	}
}
