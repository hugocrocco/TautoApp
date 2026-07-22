package cl.humboldt.credencial.model;

public class MemberRecord {
    private String rut;
    private String name;
    private String section;
    private boolean active;

    public MemberRecord() {}

    public String getRut() { return rut; }
    public void setRut(String rut) { this.rut = rut; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSection() { return section; }
    public void setSection(String section) { this.section = section; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}