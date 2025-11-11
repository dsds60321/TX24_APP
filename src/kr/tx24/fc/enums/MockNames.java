package kr.tx24.fc.enums;

public enum MockNames {

    USER("user"),
    CRAWL("crawl"),
    TMPL("tmpl"),
    DFA("dfa"),
    TRX("trx"),
    MCHT("mcht"),
    APP("app");

    private final String key;

    MockNames(String key) {
        this.key = key;
    }

    public String getKey() {
        return key;
    }
}
