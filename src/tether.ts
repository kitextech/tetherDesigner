export interface TetherComputedValues {
    d_te_mech : number
    P_el_k_r: number
    I_te_r: number
    P_te_loss_r: number
    R_te: number
    n_c: number
    A_c_w: number
    d_c_w : number
    w_c_ins: number
    d_c: number
    epsilon: number
    delta: number
    d_te: number
    L_te: number
    m_te_mech: number,
    m_c_w: number,
    m_c_ins: number,
    m_c_sh: number,
    m_c_j: number,
    m_te_j: number,
    m_te: number
}

export class TetherSegment {

    // tether constants
    // Core (mechanical strength)
    rho_te_mech = 990 // km/m3 Dyneema
    sigma_te_mech = 3090e6 // Pa Dyneema
    // wire and shield (al)
    rho_c_w = 2700 // km/m3 Aluminum
    rho_c_sh = 2700 // km/m3 Aluminum
    kappa_c_w = 3.5e7 // S/m Aluminum // specific conductivity
    // insulator PTFE
    rho_c_ins = 2200 // kg/m3 PTFE
    E_c_ins = 60e6 // V/m PTFE
    // jackets
    rho_c_j = 1000 // kg/m3 PE
    rho_te_j = 1000 // kg/m3 PE

    // Width of shields and jackets
    w_c_sh = 0.1e-3 // m
    w_c_j = 0.5e-3// m
    w_te_j = 1.0e-3// m

    // Safety factors
    S_te_mech = 3
    S_te_ins = 3

    // corrections factors
    f_c_w = 1.1
    f_c_ins = 3
    f_m_mech = 1
    f_te_m_i = 1.1

    computedValues: TetherComputedValues

    // A.1
    // Tether force
    F_te_r(power: number, tetherAngle: number, windspeed: number): number {
        return 3 * power / (Math.cos(tetherAngle) * windspeed)
    }

    // A.2
    // Area mechanical strength
    A_te_mech(F_te_r: number): number {
        return this.S_te_mech * F_te_r / this.sigma_te_mech
    }
    
    // diameter of mechanical tether component
    d_te_mech(F_te_mech: number): number {
        return Math.sqrt( 4*this.A_te_mech(F_te_mech) / Math.PI )
    }

    // A.3
    // Area 11 // 32
    A_c_w(L_te: number, R_c_w: number): number {
        return this.f_c_w * L_te / ( this.kappa_c_w * R_c_w )
    }

    // diameter 12
    d_c_w(A_c_w: number): number {
        return Math.sqrt(4*A_c_w / Math.PI)
    }

    // resistance single wire 13 // 31
    R_c_w(R_te: number, n_c: number): number {
        return R_te*n_c/4
    }

    // A.3 Resistance/Litz wire diameter
    // 14
    P_el_k_r(eta_k_r: number, P_r: number) {
        return eta_k_r * P_r
    }

    // A.4 Tether Transmission Efficient
    // 16
    I_te_r(P_el_k_r: number, U_te_r: number): number {
        return P_el_k_r/U_te_r
    }

    // A.7 Total diameter
    // 20
    d_te(d_te_mech: number, d_c: number): number {
        return d_te_mech + 2*d_c + 2*this.w_te_j 
    }

    // 21
    d_c(d_c_w: number, w_c_ins: number) {
        return d_c_w + 2 * ( w_c_ins + this.w_c_sh + this.w_c_j )
    }


    // A.10
    // 29
    P_te_loss_r(eta_te_r: number, P_el_k_r: number): number {
        return (1 - eta_te_r) * P_el_k_r
    }

    // 30
    R_te(P_te_loss_r: number, I_te_r: number): number {
        return P_te_loss_r/ Math.pow(I_te_r, 2)
    }

    // 33
    w_c_ins(r_c_w: number, U_te_r: number) : number {
        return r_c_w * ( Math.exp( this.S_te_ins * this.f_c_ins * U_te_r / ( r_c_w * this.E_c_ins * 2 ) ) - 1 )
    }

    // 34
    delta(epsilon: number, d_te_mech: number, d_c: number) {
        return Math.sin(epsilon) * ( d_te_mech/2 + d_c/2 ) / Math.sin( (Math.PI - epsilon) /2 )
    }

    compute(F_te_r: number, P_r: number, eta_k_r: number, eta_te_r: number, U_te_r: number, L_te: number): TetherComputedValues {
        
        let d_te_mech = this.d_te_mech(F_te_r)
        let P_el_k_r = this.P_el_k_r(eta_k_r, P_r)
        let I_te_r = this.I_te_r(P_el_k_r, U_te_r)
        let P_te_loss_r = this.P_te_loss_r(eta_te_r, P_el_k_r)
        let R_te = this.R_te(P_te_loss_r, I_te_r)
        
        let n_c = 0 // two conductors
        
        do {
            n_c += 2
            var R_c_w = this.R_c_w(R_te, n_c)
            var A_c_w = this.A_c_w(L_te, R_c_w)
            var d_c_w = this.d_c_w(A_c_w)
            var w_c_ins = this.w_c_ins(d_c_w/2, U_te_r)
            var d_c = this.d_c(d_c_w, w_c_ins)
            var epsilon = 2*Math.PI/n_c // 26
            var delta = this.delta(epsilon, d_te_mech, d_c)
        }
        while( delta > d_c )

        n_c -= 2
        R_c_w = this.R_c_w(R_te, n_c)
        A_c_w = this.A_c_w(L_te, R_c_w)
        d_c_w = this.d_c_w(A_c_w)
        w_c_ins = this.w_c_ins(d_c_w/2, U_te_r)
        d_c = this.d_c(d_c_w, w_c_ins)
        epsilon = 2*Math.PI/n_c // 26
        delta = this.delta(epsilon, d_te_mech, d_c)

        let d_te = this.d_te(d_te_mech, d_c)
        
        let m_te_mech = this.mass( 0, d_te_mech, this.rho_te_mech, L_te, 1 )
        let m_c_w = this.mass( 0, d_c_w, this.rho_c_w, L_te, n_c)
        let m_c_ins = this.mass( d_c_w, d_c_w + 2 * ( w_c_ins ), this.rho_c_ins, L_te, n_c )
        let m_c_sh = this.mass( d_c_w + 2 * ( w_c_ins ), d_c_w + 2 * ( w_c_ins + this.w_c_sh), this.rho_c_sh, L_te, n_c )
        let m_c_j = this.mass( d_c_w + 2 * ( w_c_ins + this.w_c_sh ), d_c_w + 2 * ( w_c_ins + this.w_c_sh + this.w_c_j), this.rho_c_j, L_te, n_c )
        let m_c = m_c_w + m_c_ins + m_c_sh + m_c_j
        let m_te_j = this.mass( d_te - 2 * this.w_te_j, d_te, this.rho_te_j, L_te, 1 )
        let m_te = m_te_mech + m_c + m_te_j


        this.computedValues = {
            d_te_mech: d_te_mech,
            P_el_k_r: P_el_k_r,
            I_te_r: I_te_r,
            P_te_loss_r: P_te_loss_r,
            R_te: R_te,
            n_c: n_c,
            A_c_w: A_c_w,
            d_c_w : d_c_w,
            w_c_ins: w_c_ins,
            d_c: d_c,
            epsilon: epsilon,
            delta: delta,
            d_te: d_te,
            L_te: L_te,
            m_te_mech: m_te_mech,
            m_c_w: m_c_w,
            m_c_ins: m_c_ins,
            m_c_sh: m_c_sh,
            m_c_j: m_c_j,
            m_te_j: m_te_j,
            m_te: m_te
        }

        return this.computedValues
    }

    // mass calculations
    mass(inner: number, outer: number, density: number, length: number, count: number) {
        return Math.PI / 4 * ( outer*outer - inner*inner ) * density * length * count
    }

}