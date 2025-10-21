package kr.tx24.fc.ctl;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import kr.tx24.lib.lang.DateUtils;

@Controller
@RequestMapping("/example")
public class ExampleCtl {
	
	@GetMapping("/thymeleaf")
    public String thymeleaf(Model model) {
		model.addAttribute("name", "Thymeleaf 테스트 "+DateUtils.getCurrentDate());
        return "sample/thymeleaf"; 
    }
	 
	         
	@GetMapping("/login")
    public String login() {
        return "sample/login"; 
    }
	   
	@GetMapping("/login2fa")
    public String login2fa() {
        return "sample/login2fa"; 
    }  
	    
	
	@GetMapping("/components")
    public String components() {
        return "sample/components"; 
    }               
	   
	@GetMapping("/dashboard")
    public String dashboard() {
        return "sample/dashboard"; 
    }
	
	@GetMapping("/tables")
    public String table() {
        return "sample/tables"; 
    }
	
	
	@GetMapping("/card2")
    public String card2() {
        return "sample/card2"; 
    }
	
	
	@GetMapping("/card")
    public String card() {
        return "sample/card"; 
    }
	
	
	@GetMapping("/forms")
    public String forms() {
        return "sample/forms"; 
    }
	
	
	
}
