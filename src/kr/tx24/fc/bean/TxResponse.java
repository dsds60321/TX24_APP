package kr.tx24.fc.bean;

import java.io.Serializable;

/**
 * 공통 클래스
 */
public class TxResponse<T> implements Serializable {

	public boolean result;
	public String msg;
	public String link;
	public T data;

	public TxResponse() {
	}

	public TxResponse(boolean result, String msg, String link, T data) {
		this.result = result;
		this.msg = msg;
		this.link = link;
		this.data = data;
	}

	public static <T> TxResponse<T> ok(T data) {
		return new TxResponse<>(true, null, null, data);
	}

	public static <T> TxResponse<T> fail(String msg) {
		return new TxResponse<>(false, msg, null, null);
	}

	public TxResponse<T> message(String message) {
		this.msg = message;
		return this;
	}

	public TxResponse<?> link(T link) {
		this.link = link.toString();
		return this;
	}
}
