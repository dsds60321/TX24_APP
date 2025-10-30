package kr.tx24.fc.bean;

import kr.tx24.lib.map.SharedMap;
import kr.tx24.lib.db.RecordSet;
import kr.tx24.lib.map.LinkedMap;
import kr.tx24.lib.map.SharedMap;

import java.util.List;
import java.util.Map;

public class SearchResponse {

	public List<SharedMap<String, Object>> datas 	= null;
	public SearchPage page 							= null;
	public LinkedMap<String, Object> totalMap 		= null;
	
	
	public SearchResponse(){
	}
	
	public SearchResponse(RecordSet rset, SearchPage page){
		this.datas = rset.getRows();
		page(page);
		index();
	}

	public SearchResponse(List<SharedMap<String, Object>> list, SearchPage page){
		this.datas = list;
		page(page);
		index();
	}
	
	/**
	 * INDEX ASC
	 * @param list
	 * @param page
	 */
	public SearchResponse(List<SharedMap<String, Object>> list, SearchPage page, long selectPage , long totalSize){
		this.datas = list;
		page(page);
		indexAsc(selectPage,totalSize);
	}
	
	/**
	 * INDEX ASC
	 * @param page
	 * @return
	 */
	public SearchResponse(RecordSet rset, SearchPage page, long selectPage , long totalSize ){
		this.datas = rset.getRows();
		page(page);
		indexAsc(selectPage,totalSize);
	}
	
	/**
	 * INDEX ASC
	 * @return
	 */
	public SearchResponse indexAsc(long selectPage,long totalSize) {
		long index = 1;
		long pageNo = 0;
		for(Map<String, Object> eachMap : this.datas) {
			if(page != null) {
				if(selectPage == 0) {
					eachMap.put("@INDEX", totalSize-1 + index--);
				} else {
					pageNo = ((totalSize-1) - page.rowsPerPage * selectPage) + index--;
					eachMap.put("@INDEX", pageNo);
				}
			}
		}
		return this;
	}
	
	public SearchResponse index() {
		long index = 1;
		for(Map<String, Object> eachMap : this.datas) {
			if(page != null) {
				long start = page.rowsPerPage * page.selectedPage;
				eachMap.put("@INDEX", start + index++);
			}
		}
		
		return this;
	}
	
	public SearchResponse page(SearchPage page) {
		this.page = page;
		/*
		 * lastpage 쿼리 변경
		if(this.page.lastPage == 0 && this.page.totalSize != 0) {					
			this.page.lastPage = (this.page.totalSize / this.page.rowsPerPage) + 1;
		}
		*/
		if(this.page.totalSize>0) { 
			this.page.lastPage = this.page.totalSize / this.page.rowsPerPage;
			if(this.page.totalSize % this.page.rowsPerPage>0) {
				this.page.lastPage++;
			}
		}
		return this;
	}
	
	
}
	