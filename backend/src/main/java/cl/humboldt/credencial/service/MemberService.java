package cl.humboldt.credencial.service;

import cl.humboldt.credencial.entity.Member;
import cl.humboldt.credencial.model.member.MemberResponse;
import cl.humboldt.credencial.model.member.MemberUpsertRequest;
import cl.humboldt.credencial.repo.MemberRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
public class MemberService {

    private final MemberRepository memberRepository;

    public MemberService(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    public List<MemberResponse> listAll() {
        return memberRepository.findAll().stream()
                .sorted(Comparator.comparing(Member::getNombreCompleto, Comparator.nullsLast(String::compareToIgnoreCase)))
                .map(this::toResponse)
                .toList();
    }

    public MemberResponse upsert(MemberUpsertRequest req) {
        String rut = normalizeRut(req.getRut());
        if (rut.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "RUT es obligatorio");
        }
        if (req.getNombreCompleto() == null || req.getNombreCompleto().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "nombreCompleto es obligatorio");
        }

        Member member = memberRepository.findByRut(rut).orElseGet(Member::new);

        member.setRut(rut);
        member.setNombreCompleto(req.getNombreCompleto().trim());
        member.setEmail(req.getEmail() != null ? req.getEmail().trim() : null);
        member.setTelefono(req.getTelefono() != null ? req.getTelefono().trim() : null);

        String estado = (req.getEstadoSindicato() == null || req.getEstadoSindicato().isBlank())
                ? "ACTIVO"
                : req.getEstadoSindicato().trim().toUpperCase();
        member.setEstadoSindicato(estado);

        member.setAlDiaCuotas(req.getAlDiaCuotas());

        if (req.getUltimaCuotaPagada() != null && !req.getUltimaCuotaPagada().isBlank()) {
            member.setUltimaCuotaPagada(LocalDate.parse(req.getUltimaCuotaPagada().trim()));
        } else {
            member.setUltimaCuotaPagada(null);
        }

        Member saved = memberRepository.save(member);
        return toResponse(saved);
    }

    public MemberResponse getByRut(String rutRaw) {
        String rut = normalizeRut(rutRaw);
        Member member = memberRepository.findByRut(rut)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Miembro no encontrado"));
        return toResponse(member);
    }

    private MemberResponse toResponse(Member m) {
        return new MemberResponse(
                m.getId(),
                m.getRut(),
                m.getNombreCompleto(),
                m.getEmail(),
                m.getTelefono(),
                m.getEstadoSindicato(),
                m.getAlDiaCuotas(),
                m.getUltimaCuotaPagada()
        );
    }

    private String normalizeRut(String rut) {
        return rut == null ? "" : rut.trim();
    }
}