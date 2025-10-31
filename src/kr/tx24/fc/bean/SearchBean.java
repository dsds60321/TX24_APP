package kr.tx24.fc.bean;

import java.io.Serializable;

public class SearchBean implements Serializable {
    public String id        = null;  // 검색키
    public Object value     = null;  // 검색데이터
    public String oper      = "eq";  // 비교연산자
    public boolean is       = false; // 검색여부
    public String logical   = null;  // 논리연산자
    public int priority     = 0;     // 검색 우선순위

    public SearchBean id(String id) {
    	this.id 	= id;
    	return this;
    		
    }
    
 
    public SearchBean oper(String oper) {
    	this.oper 	= oper;
    	return this; 
    		
    }
    
    
    public SearchBean value(Object value) {
    	this.value 	= value;
    	return this;
    		
    }
    
    public SearchBean is(boolean is) {
    	this.is 	= is;
    	return this;		
    }
    
    public SearchBean logical(String logical) {
    	this.logical 	= logical;
    	return this;
    }
    public SearchBean priority(int priority) {
    	this.priority 	= priority;
    	return this;
    }
    
   
}
