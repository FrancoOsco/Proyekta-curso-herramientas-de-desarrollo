package com.curso.marcos_de_desarroll_web.springboot.web.springboot_web.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.List;

@Entity
@Table(name = "proyecto")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String code;

    @Column(name = "created_at")
    private String createdAt;

    private String description;

    @Column(name = "end_date")
    private String end;

    private String method;

    @Column(nullable = false)
    private String name;

    @Column(name = "start_date")
    private String start;

    @Column(name = "members", columnDefinition = "TEXT")
    private String members;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    @JsonIgnore
    private Usuario owner;

    public Project() {
        this.code = "PRJ-" + System.currentTimeMillis() + "-" + (int) (Math.random() * 1000);
        this.createdAt = OffsetDateTime.now().toString();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getEnd() {
        return end;
    }

    public void setEnd(String end) {
        this.end = end;
    }

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getStart() {
        return start;
    }

    public void setStart(String start) {
        this.start = start;
    }

    public List<String> getMembers() {
        if (members == null || members.isEmpty()) {
            return List.of();
        }
        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(members, new TypeReference<List<String>>() {
            });
        } catch (IOException e) {
            e.printStackTrace();
            return List.of();
        }
    }

    public void setMembers(List<String> membersList) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            this.members = mapper.writeValueAsString(membersList);
        } catch (IOException e) {
            e.printStackTrace();
            this.members = "[]";
        }
    }

    public Usuario getOwner() {
        return owner;
    }

    public void setOwner(Usuario owner) {
        this.owner = owner;
    }
}
