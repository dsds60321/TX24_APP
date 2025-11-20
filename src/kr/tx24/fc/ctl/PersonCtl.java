package kr.tx24.fc.ctl;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/person")
public class PersonCtl {

    @GetMapping("/{id}")
    public String detailView(@PathVariable("id") String id) {
        return "pages/person/view";
    }
}
