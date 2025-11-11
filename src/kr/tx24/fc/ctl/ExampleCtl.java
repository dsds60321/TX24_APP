package kr.tx24.fc.ctl;

import kr.tx24.lib.db.Retrieve;
import kr.tx24.lib.map.SharedMap;
import kr.tx24.was.annotation.SessionIgnore;
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

    @SessionIgnore
	@GetMapping("/login2fa")
    public String login2fa() {
        return "sample/login2fa"; 
    }


    @SessionIgnore
	@GetMapping("/components")
    public String components() {
        return "sample/components"; 
    }               
	   
	@GetMapping("/dashboard")
    public String dashboard() {
        return "sample/dashboard"; 
    }

    @SessionIgnore
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

    @SessionIgnore
    @GetMapping("/modal/default")
    public String modalDefault(Model model) {
        return "sample/modal/default";
    }

    @SessionIgnore
    @GetMapping("/modal/fail")
    public String modalFail(Model model) {
        return "sample/modal/fail";
    }

    @SessionIgnore
    @GetMapping("/modal/tab")
    public String modalTab(Model model) {
        return "sample/modal/tabs";
    }

    @SessionIgnore
	@GetMapping("/modal/form")
	public String modalForm(Model model) {
        SharedMap<String, Object> map = new SharedMap<>();
        map.put("name" , "test");
        map.put("email" , "test");
        map.put("role" , "test");
        map.put("phone" , "test");
        model.addAttribute("param" , map);
		return "sample/modal/form";
	}

    @GetMapping("/modal/scroll")
    public String modalScroll(Model model) {
        return "sample/modal/scroll";
    }

}
