package cl.humboldt.credencial.controller;

import cl.humboldt.credencial.model.member.MemberResponse;
import cl.humboldt.credencial.model.member.MemberUpsertRequest;
import cl.humboldt.credencial.service.MemberService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/members")
@CrossOrigin(origins = "http://localhost:5173")
public class AdminMembersController {

    private final MemberService memberService;

    public AdminMembersController(MemberService memberService) {
        this.memberService = memberService;
    }

    @GetMapping
    public List<MemberResponse> listAll() {
        return memberService.listAll();
    }

    @PostMapping
    public ResponseEntity<MemberResponse> upsert(@RequestBody MemberUpsertRequest request) {
        MemberResponse saved = memberService.upsert(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/{rut}")
    public MemberResponse getByRut(@PathVariable String rut) {
        return memberService.getByRut(rut);
    }
}