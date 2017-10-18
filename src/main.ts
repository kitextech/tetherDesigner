import { TetherComputedValues, TetherSegment } from "./tether"

/// <reference types="jquery" />
/// <reference types="jqueryui" />

import * as d3 from 'd3'


interface SimulationConfig {
    [key: string]: number
    Power: number
    Force: number
    Voltage: number
    TetherEfficiency: number
    TetherLength: number
}

class Simulation {

    tether: TetherSegment

    constructor(config: SimulationConfig) {
        this.tether = new TetherSegment()
        
        // pre compute actual tether dimensions. 
        this.tether.compute(config.Force, config.Power, 0.9, config.TetherEfficiency, config.Voltage, config.TetherLength)
    }
}

$(document).ready(() => {

    var defaultConfig: SimulationConfig = {
        Power: 100e3,
        Force: 30e3,
        Voltage: 2e3,
        TetherEfficiency: 0.97,
        TetherLength: 300
    }
    
    let sim = new Simulation(defaultConfig)
    displayNumbers(sim)
    displayComputedValues(sim.tether.computedValues)
    
    for (let key in defaultConfig) {
        if (defaultConfig.hasOwnProperty(key)) {

            let value = defaultConfig[key]
            let topDiv = $('<div></div>').addClass('container')
            let keyDiv = $("<div>" + key + ":</div>").addClass('sl0')
            let pDiv = $('<div></div>').addClass('sl1')

            topDiv.append(keyDiv)
            topDiv.append(pDiv)
            pDiv.html(value.toString())

            let slider = $('<div></div>').slider({
                min: value * 0.2,
                max: value * 5,
                step: value / 100,
                value: value,
                slide: (event, ui) => {
                    defaultConfig[key] = ui.value
                    pDiv.html(ui.value.toString())
                    let sim = new Simulation(defaultConfig)
                    displayComputedValues(sim.tether.computedValues)
                    displayNumbers(sim)

                }
            }).addClass('sl2')

            topDiv.append(slider)

            $("#sliders").append(topDiv)
        }
    }

})

function displayComputedValues(tp: TetherComputedValues) {

    let id = "tetherPlot"    
    let height = 500 // px
    let width = 500 // px
    let margin = { top: 30, right: 20, bottom: 30, left: 0 }
    let widthTotal = width+margin.left+margin.right
    let heightTotal = width+margin.top+margin.bottom

    let x = d3.scaleLinear().domain([-tp.d_te/2, tp.d_te/2]).range([0,height])
    let xmm = d3.scaleLinear().domain([-tp.d_te/2*1000, tp.d_te/2*1000]).range([0,height])
    let r = d3.scaleLinear().domain([0, tp.d_te]).range([0,height])
    
    interface CircleDef {
        x: number
        y: number
        dia: number
        c: string
        d: string // description
        t?: number // optional thickness
    }

    let ts = new TetherSegment()
    

    let circles: CircleDef[] = [
        {x: 0, y: 0, dia: tp.d_te, c: 'lightblue', d: 'Tether jacket', t: ts.w_te_j},
        {x: 0, y: 0, dia: tp.d_te-2*ts.w_te_j, c: 'white', d: 'Empty space'},
        {x: 0, y: 0, dia: tp.d_te_mech, c: 'grey', d: 'Mechanical strain'},
    ]


    for (var i = 0; i < tp.n_c; i++) {
        let t = 2*Math.PI * i / tp.n_c
        let r = tp.d_te_mech/2 + tp.d_c/2
        circles.push({x: r*Math.cos(t), y: r*Math.sin(t), 
            dia: tp.d_c_w + 2*(tp.w_c_ins + ts.w_c_sh + ts.w_c_j) , c: '#F00', d: 'Conductor jacket', t: ts.w_c_j})
        circles.push({x: r*Math.cos(t), y: r*Math.sin(t), 
            dia: tp.d_c_w + 2*(tp.w_c_ins + ts.w_c_sh), c: '#333', d: 'Conductor shield', t: ts.w_c_sh})
        circles.push({x: r*Math.cos(t), y: r*Math.sin(t), 
            dia: tp.d_c_w + 2*(tp.w_c_ins), c: '#AAA', d: 'Conductor insulator', t: tp.w_c_ins})
        circles.push({x: r*Math.cos(t), y: r*Math.sin(t), 
            dia: tp.d_c_w, c: '#212', d: 'Conductor'})
    }

    d3.select(`#${id}`).selectAll("svg").remove()
    


    let svg = d3.select(`#${id}`).append("svg")
        .attr("width", widthTotal)
        .attr("height", heightTotal)
        .append("g")
        .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")")
        
    // Add the valueline path.

    let circlegroups = svg.selectAll("circle")
        .data(circles)
        .enter()
        .append("g")
        .attr("class", "tooltip")

    circlegroups
        .append('circle')
        .attr("cx", d  => { return x(d.x) } ) 
        .attr("cy", d  => { return x(d.y) } ) 
        .attr("r", d  => { return r(d.dia/2) } ) 
        .style("fill", d => { return d.c } )

    circlegroups
        .append('text')
        .attr("x", 0)
        .attr("y", 0)
        .text( d => { return d.d })
    
    circlegroups
        .append('text')
        .attr("x", 0)
        .attr("y", 20)
        .text( d => { return `Outer Diameter: ${(d.dia*1000).toFixed(2)} mm` })
    
    circlegroups
        .filter( d => { return typeof d.t != "undefined" })
        .append('text')
        .attr("x", 0)
        .attr("y", 40)
        .text( d => { return `Thickness: ${(d.t*1000).toFixed(2)} mm` })

    // Add the X Axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xmm))
}


function displayNumbers(sim: Simulation) {
    let tether = sim.tether
    let tp = tether.computedValues
    
    type InfoSet = [string, string, number | string]

    let tetherInfo: InfoSet[] = [
        ['Tether outside diameter', 'mm', (tp.d_te*1000).toFixed(2)],
        ['Number of conductors (n_c)', '', tp.n_c],
    ]

    let materialProperties: InfoSet[] = [
        ['Mechanical Dyneema Density', 'kg/m3', tether.rho_te_mech],
        ['Mechanical Dyneema Yield Strength', 'Pa', tether.sigma_te_mech.toExponential(3)],
        ['Tether Jacket PE Density', 'kg/m3', tether.rho_te_j],
        ['Conductor Jacket PE Density', 'kg/m3', tether.rho_c_j],
        ['Conductor Wire Alu Density', 'kg/m3', tether.rho_c_w],
        ['Conductor Wire Alu Spe. Conduc.', 'S/m', tether.kappa_c_w.toExponential(3)],
        ['Conductor Shield Alu Density', 'kg/m3', tether.rho_c_sh],
        ['Conductor Insulator PTFE Density', 'kg/m3', tether.rho_c_ins],
        ['Conductor Insulator PTFE E-field Stregth', 'V/m', tether.E_c_ins.toExponential(3)],
    ]

    let dimensions: InfoSet[] = [
        ['Conductor Shield thicknees', 'mm', tether.w_c_sh*1000],
        ['Conductor Jacket thickness', 'mm', tether.w_c_j*1000],
        ['Tether Jacket thickness', 'mm', tether.w_te_j*1000],
    ]

    let safetyFactors: InfoSet[] = [
        ['Mechanical', '', tether.S_te_mech],
        ['Insulation', '', tether.S_te_ins],
    ]
    
    let correctionFactors: InfoSet[] = [
        ['Wire strands area', '', tether.f_c_w],
        ['Voltage spikes', '', tether.f_c_ins],
        ['mass mechanical', '', tether.f_m_mech],
        ['mass conductors', '', tether.f_te_m_i],
    ]

    let info: { [index: string]: InfoSet[] } = {
        TetherInfo: tetherInfo,
        MaterialProperties: materialProperties,
        CorrectionFactors: correctionFactors,
        SafetyFactors: safetyFactors,
        Dimensions: dimensions
    }

    $("#info").html("")

    for (let key in info) {
        if (info.hasOwnProperty(key)) {
            let infosets = info[key];
            let headerDiv = $(`<div><h3>${key}</h3></div>`)

            infosets.forEach(infoset => {
                let rowDiv = $(`<div></div>`).addClass('container')
                rowDiv.append($("<div></div>").html(infoset[0].toString()).addClass('sl0'))
                rowDiv.append($("<div></div>").html(infoset[2].toString()).addClass('sl1'))
                rowDiv.append($("<div></div>").html(infoset[1].toString()).addClass('sl2'))
                headerDiv.append(rowDiv)
            })

            $("#info").append(headerDiv)
        }
    }

}