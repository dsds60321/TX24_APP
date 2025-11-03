package kr.tx24.fc.enums;

public enum MockNames {

	CRAWL("crawl"),
	DFA("dfa");

	private final String key;

	MockNames(String key) {
		this.key = key;
	}

	public String getKey() {
		return key;
	}
}
