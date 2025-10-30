package kr.tx24.fc.bean;

import java.util.List;

public class SearchPage {
	public long rowsPerPage = 20; 
	public long totalSize = 0; 
	public long selectedPage = 0; 
	public long lastPage = 0; 
	public long otherSize = 0; 

	public SearchPage() {}
	public SearchPage(List<Long> limit) {
		if(limit == null || limit.size() != 2) {
		} else {
			this.selectedPage = limit.get(0);
			this.rowsPerPage = limit.get(1);
		}
	}

	public long getOtherSize() {
		return this.otherSize;
	}

	public void setOtherSize(long otherSize) {
		this.otherSize = otherSize;
	}

	public long getLimitFirst() {
		long res = (rowsPerPage * selectedPage);
		return res;
	}
	
	public SearchPage rowsPerPage(long rowsPerPage){
		this.rowsPerPage = rowsPerPage;
		return this;
	}
	
	public SearchPage totalSize(long totalSize){
		this.totalSize = totalSize;
		return this;
	}
	
	public SearchPage selectedPage(long selectedPage){
		this.selectedPage = selectedPage;
		return this;
	}
	
	public SearchPage lastPage(long lastPage){
		this.lastPage = lastPage;
		return this;
	}
}