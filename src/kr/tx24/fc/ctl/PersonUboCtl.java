package kr.tx24.fc.ctl;

import kr.tx24.fc.service.PersonUboSvc;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/person/ubo")
public class PersonUboCtl {

    private final PersonUboSvc personUboSvc;

    public PersonUboCtl(PersonUboSvc personUboSvc) {
        this.personUboSvc = personUboSvc;
    }

    @GetMapping("/list/{id}")
    public String list(@PathVariable("id") String id, Model mv) {
        mv.addAttribute("ID", id);
        mv.addAttribute("PERSON", personUboSvc.getList(id, null));
        return "pages/person/ubo/view";
    }

    @GetMapping("/add")
    public String add() {
        return "pages/person/ubo/add";
    }
}
