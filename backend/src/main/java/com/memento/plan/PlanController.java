package com.memento.plan;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Calcule un plan de travail. Route publique : elle ne lit ni n'écrit aucune donnée. */
@RestController
@RequestMapping("/api/plan")
public class PlanController {

    private final PlanService service;

    public PlanController(PlanService service) {
        this.service = service;
    }

    @PostMapping
    public List<PlanDay> create(@Valid @RequestBody PlanRequest request) {
        return service.build(request.deadline(), request.minutesPerDay());
    }
}
