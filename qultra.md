# Using QuLTRA

[QuLTRA](https://github.com/SimonaZaccaria/QuLTRA) performs energy-participation-ratio quantisation of superconducting circuits with **lumped and distributed elements together**.
It accepts coplanar-waveguide sections and returns mode frequencies, linewidths, participation ratios, and the Kerr matrix.

**Read the six checks below before using results.**
The first covers three ways the mode finder loses a mode; any one of them changes the normalisation of every participation ratio and so every Kerr, including for the modes it found.

> **Scope.**
> The measurements below came from circuits with a transmon, a tapped quarter-wave line, and lumped nodes.
> Retain the checks when applying the package to another circuit.

---

## 1. The default scan step silently misses modes, and one missed mode poisons everything

`find_zeros.zero_algo` locates modes by scanning for sign changes of the characteristic polynomial in steps of a module-level constant, `qultra.constants.step`, whose default is **0.1 GHz**.
Two modes closer together than one step both fall inside a single interval, the sign does not change across it, and **both are missed with nothing raised**.

`total_inductive_energy` sums over the supplied modes, so an incomplete list changes the normalisation of every participation ratio and therefore every derived Kerr.

Modes found on a four-mode circuit whose two highest sat 25 MHz apart:

| `qultra.constants.step` | modes found (there are four) |
|---|---|
| 0.1 GHz (default) | **2** |
| 0.05 GHz | **2** |
| 0.02 GHz | 4 |
| 0.01 GHz | 4 |

**Set the step before importing code that builds a circuit.**
It is read at solve time:

```python
import qultra.constants as KQ
KQ.step = 0.01                     # 0.01 GHz; the default 0.1 misses modes 25 MHz apart
import my_circuit_module           # only now
```

**And assert on the count.**
The step is a heuristic, not a guarantee:

```python
modes = solve(netlist)
if len(modes) < 4:
    raise RuntimeError("expected 4 modes, got %s GHz"
                       % [round(f / 1e9, 4) for f in modes])
```

### The same failure arrives from the node count, with no step that fixes it

Mode loss also occurs as node count increases, for well-separated modes.
The same circuit with its line replaced by two `N`-section L-C ladders:

| ladder sections per segment | nodes | modes found (there are four) | time |
|---|---|---|---|
| 16 | 33 | 4 | 4.5 s |
| 32 | 65 | **2** | 28 s |
| 48 | 97 | **2** | 169 s |

The survivors were the pair 327 MHz apart near 24 GHz; the modes at 3.1 and 6 GHz disappeared, and halving `step` to 0.005 GHz did not recover them.
Test the practical node-count limit for each circuit and assert the mode count.

### And a third: a single well-separated mode is lost for being broad

Measured while sweeping the out-coupling capacitor, holding the other six element values fixed so the coupled mode was free to broaden.
The mode that disappears is the **broad** one, not a member of the close pair:

| out-coupling capacitor | that mode's `kappa/2pi` | its Q | modes found (there are four) |
|---|---|---|---|
| 37.4 fF | 81.3 MHz | 74 | 4 |
| 40 fF | 90.4 MHz | 66 | 4 |
| 42 fF | 97.4 MHz | 58 | 4 |
| 44 fF | — | — | **3** |
| 46 fF | — | — | **3** |
| 50 fF | — | — | **3** |

The edge sits where that mode's quality factor falls to about **58**, and the mode is still there: a harmonic-balance solver on the same circuit finds it at every capacitance past the edge, and agrees with this package to 0.02% in width and 3e-5 in frequency wherever both find it.
**A root-finder that scans for sign changes can lose a pole whose imaginary part is large**, and no step size recovers it.

This bounds a design solve rather than a single solve.
A single solve that loses a mode raises, and a wrapper asserting the count catches it.
A Newton solve calling the mode finder inside its Jacobian fails at whatever target first drives the mode past the edge, and the failure looks like the *circuit* running out of room.
Report such a ceiling as a limit on the solve, bracketed between the last target that converged and the first that did not, and check it against a second construction before calling it a property of the device.

## 2. `CPW.inductive_energy` is marked unverified in its own source, and it is correct

`CPW.inductive_energy` carries the comment `da verificare se e giusto !!!!!`.
A wrong prefactor would alter participation ratios and Kerrs without changing frequencies or linewidths, so the linear solve alone cannot validate it.

**It is verified and it is right — take numbers out of it.**
Its prefactor `Z0/(2v)` is exactly `L'/2` for a line whose inductance per unit length is `L' = Z0/v`, so what it evaluates is the textbook `(1/2) L' ∫|I|²dx`, and its `CPW.current` reconstructs both travelling-wave amplitudes correctly from the two end voltages.
Four independent checks agree, the tightest to 5.3 × 10⁻¹⁵.

**Check mode completeness (§1) before suspecting this energy term.**

## 3. `epsilon_eff = (1 + epsilon_r)/2` is the package's own idealisation

The phase velocity used for a CPW comes from `qultra.constants.epsilon_r` through `epsilon_eff = (1 + epsilon_r)/2`, the standard thin-film half-space estimate.
On silicon that is `epsilon_eff = 6.45` and `v = 1.18043 × 10⁸ m/s`.

The model omits finite conductor width, gap, metal thickness, and substrate depth.
**Its line lengths describe that idealised medium.**
Validate them with a cross-section calculation before using them as fabrication dimensions.

**Set `qultra.constants.epsilon_r` before building any `CPW`.**
Each line reads it once, when it is constructed, and the default is 11.9; a value set afterwards does not reach lines already built.

## 5. A wide window returns modes you did not design for

Widening `(fmin, fmax)` to keep a swept mode inside it (check 4) also brings in modes outside the design, such as a common mode of floating nodes against ground.
**Identify each designed mode by its participations, not by its index or frequency order,** and assert a lower bound on the mode count rather than an exact count.
Modes of different symmetry can also cross as a parameter moves, which reorders them.

## 6. A root-finder can land on another mode's branch

A bracket wide enough to find a target can contain the same target met by a different mode, so a solve for, say, a line length that puts "the readout" at 6 GHz can return a line that puts another mode there.
**Classify the mode at every function evaluation, keep brackets close to the design, and treat a jump in the solved parameter as a branch change, not a design.**
A boundary found this way is a limit of the solve's bounds and is reported as one.

## 4. A mode leaving its search window surfaces as an error from inside the Jacobian

`QuLTRA` raises `No zeros found in the specified interval` when `(fmin, fmax)` contains no mode.
During a Newton solve, bisection, or sweep, check which parameter moved the mode outside its window.

The cause is nearly always a **fixed** window over a swept parameter: a shunt capacitance can run its node's own resonance from 153 GHz down to 1.5, and a line length moves the line's resonance out of any window pinned near its design value.

**Scale windows and brackets to the current target.**
If a full Newton step enters a region with no mode, halve the step and retry.

---

## What it publishes, and what that is good for

`run_epr` returns participation ratios **directly**, alongside frequencies, linewidths, and the Kerr matrix.

Every Kerr is a function of the mode frequencies and `p` alone,

    alpha_i  = -f_i^2 p_i^2   / (8 EJ),
    chi_ij   = -f_i f_j p_i p_j / (4 EJ),

so compare the participation inputs as well as derived Kerrs.
Against two other quantisations of the same lumped circuit, participations agreed to 7.4 × 10⁻⁵ and the worst deviation on any quantity was 1.6 × 10⁻⁴.

It also takes the junction's linear inductance and **derives `EJ` from it** rather than accepting both.
A tool given both can end up describing two different junctions; the signature is every Kerr off by one constant factor while every frequency and linewidth is right.

**Electric participation in any capacitor comes from the node voltages.**
The method `eigenvectors()` returns each mode's node voltages, ground first, and `total_inductive_energy()` its peak inductive energy, which for a lossless mode is also its total energy.
A capacitor's share of a mode's electric energy is ½C|ΔV|² over that total.
Check a sum of such shares against a closed-form capacitance ratio; the agreement tests the bookkeeping, not the physics, because both use the same capacitances.

**For a lumped circuit, a second quantisation from the capacitance and inverse-inductance matrices is cheap.**
Solve the generalised eigenproblem of the two matrices, drop the zero-frequency charge mode of any floating island, and compare frequencies and participations.

## A phase-biased junction

A flux through a loop of junctions biases each one to a static phase φ.
**Replacing each junction's inductance by L_J/cos φ captures the bias in the linear modes and in the quartic Kerr terms**, since both the quadratic and the quartic coefficients scale as E_J cos φ, and the derived `EJ` becomes E_J cos φ accordingly.
**It omits the cubic terms the bias creates**, whose second-order contribution to the Kerr coefficients relative to the quartic one grows as tan²φ.
Report Kerr values under bias as quartic-only estimates, mark where tan²φ is not small, and say which branch of the loop's static solution was followed, since a loop near half a flux quantum can have two of equal energy.

## Installing it

```bash
python -m venv .venv
.venv/Scripts/python -m pip install git+https://github.com/SimonaZaccaria/QuLTRA    # Windows; .venv/bin/python elsewhere
```

Keep the environment out of version control.

## Sign convention

Kerrs come back **positive**, with the sign carried in the Hamiltonian.
Anharmonicities and dispersive shifts are negative for a transmon, so a table written signed has to negate them, and one written unsigned has to say so.
