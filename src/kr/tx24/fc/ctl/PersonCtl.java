package kr.tx24.fc.ctl;

import kr.tx24.fc.service.PersonSvc;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/person")
public class PersonCtl {

    private final PersonSvc personSvc;

    public PersonCtl(PersonSvc personSvc) {
        this.personSvc = personSvc;
    }

    /**
     * NOTE : 담당자 리스트
     */
    @GetMapping("/list/{id}")
    public String list(@PathVariable("id") String id, Model mv) {
        mv.addAttribute("ID", id);
        mv.addAttribute("PERSON", personSvc.getList(id, null));
        return "pages/person/view";
    }

    /**
     * NOTE : 타입 별 담당자 리스트
     */
    @GetMapping("list/{type}/{id}")
    public String listByType(@PathVariable("type") String type, @PathVariable("id") String id, Model mv) {

        mv.addAttribute("ID", id);
        mv.addAttribute("TYPE", type);
        mv.addAttribute("PERSON", personSvc.getList(id, type));
        return "pages/person/view";
    }
}
