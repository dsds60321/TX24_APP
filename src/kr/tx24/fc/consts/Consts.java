package kr.tx24.fc.consts;

public final class Consts {
    private Consts() {}

    public static final class Login {
        public static final String CSRF_FORMAT = "TX_CSRF_KEY:{}";
    }

    public static final class Session {
        public static final String SESSION_STORE = "WSDATA|{}";
        public static final String DAY_SESSION_STORE = "ONE_DAY_SESSION_STORE|{}";
    }
}
