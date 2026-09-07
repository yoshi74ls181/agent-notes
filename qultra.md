# Using QuLTRA

Working notes on [QuLTRA](https://github.com/SimonaZaccaria/QuLTRA), a Python package that does
energy-participation-ratio quantisation of superconducting circuits containing **lumped and
distributed elements together**. That combination is the reason to reach for it: it will take a
netlist with a coplanar-waveguide section in it and hand back mode frequencies, linewidths,
participation ratios and the full Kerr matrix, which a lumped nodal-admittance solver cannot do
at all.

**Read the four numbered sections below before trusting a number out of it.** Section 1 is the
one that fails *silently* — the answer is wrong and nothing is raised — and it makes every
participation ratio in the run wrong at once. Section 3 is a silent idealisation rather than a
fault. Section 2 is a term the package's own author marks as unchecked, and it is correct.

> **Scope.** Everything here is about the package rather than about anyone's physics, so it
> transfers to any project using it. The numbers quoted are measurements of the package's
> behaviour, taken on real circuits with a transmon, a tapped quarter-wave line and a few lumped
> nodes; nothing here needs any particular circuit to be read.

---

## 1. The default scan step silently misses modes, and one missed mode poisons everything

This is the trap to know before any other, because it does not announce itself and it is not
local: a short mode list makes *every* participation ratio wrong at once.

`find_zeros.zero_algo` locates modes by scanning for sign changes of the characteristic
polynomial in steps of a module-level constant, `qultra.constants.step`, whose default is
**0.1 GHz**. Two modes closer together than one step both fall inside a single interval, the sign
does not change across it, and **both are missed with nothing raised**. The mode list simply
comes back short.

That would be survivable if it stayed local, and it does not. `total_inductive_energy` sums over
the modes it was given, so a short list gives the wrong total, and every participation ratio is
divided by it. Every `p` is then wrong, and because every Kerr is a function of the frequencies
and `p` alone, every Kerr is wrong with them — including modes the scan *did* find.

Measured on a four-mode circuit whose two highest modes sat **25 MHz** apart:

| `qultra.constants.step` | modes found (there are four) |
|---|---|
| 0.1 GHz (default) | **2** |
| 0.05 GHz | **2** |
| 0.02 GHz | 4 |
| 0.01 GHz | 4 |

**Set it before importing anything that builds a circuit**, because it is read at solve time but
the import order is the thing you will get wrong:

```python
import qultra.constants as KQ
KQ.step = 0.01                     # 0.01 GHz; the default 0.1 misses modes 25 MHz apart
import my_circuit_module           # only now
```

**And assert on the count.** The step is a heuristic, not a guarantee, so a wrapper that knows
how many modes the circuit has should say so:

```python
modes = solve(netlist)
if len(modes) < 4:
    raise RuntimeError("expected 4 modes, got %s GHz"
                       % [round(f / 1e9, 4) for f in modes])
```

That assertion is what turns a silent wrong answer into a stack trace, and it is cheap.

### The same failure also arrives from the NODE COUNT, with no step that fixes it

Worth knowing as a separate case, because the fix for the one above does not touch it and the
assertion is the only thing that catches both. Modes go missing when the netlist gets *large*,
however far apart they are. Measured on the same four-mode circuit with its line replaced by a
pair of `N`-section L-C ladders, so that only the node count moved:

| ladder sections per segment | nodes | modes found (there are four) | time |
|---|---|---|---|
| 16 | 33 | 4 | 4.5 s |
| 32 | 65 | **2** | 28 s |
| 48 | 97 | **2** | 169 s |

The two survivors were a pair 327 MHz apart near 24 GHz; what vanished were modes at 3.1 GHz and
6 GHz, nowhere near each other or anything else. Halving `step` to 0.005 GHz recovered neither,
so this is not section 1's mechanism wearing a different hat — a sign change that a finer scan
would find is not what is being lost. Expect a practical ceiling somewhere around a few tens of
nodes, find it by experiment for the circuit in hand, and assert on the count.

## 2. `CPW.inductive_energy` is marked unverified in its own source, and it is correct

The function that supplies the inductive energy of a coplanar-waveguide section carries the
comment `da verificare se e giusto !!!!!` — the author flagging it as unchecked. It is also
precisely the term that makes a participation ratio meaningful whenever the netlist has a line in
it, which is the case you chose this package for. A wrong prefactor there would move every `p`
and so every Kerr while leaving every frequency and every linewidth right, which is the signature
no internal check of the linear solve responds to.

**It is verified and it is right — take numbers out of it.** Its prefactor `Z0/(2v)` is exactly
`L'/2` for a line whose inductance per unit length is `L' = Z0/v`, so what it evaluates is the
textbook `(1/2) L' ∫|I|²dx`, and its `CPW.current` reconstructs both travelling-wave amplitudes
correctly from the two end voltages. Four independent checks agree, the tightest to
5.3 × 10⁻¹⁵: a closed form for the same integral, the analytic energy of a shorted line across
electrical lengths from 0.05π to 1.5π, the lumped limit as the length goes to zero, and an
`N`-section L-C ladder put in place of the line so that the same circuit is quantised with the
distributed term present and then absent.

**If a participation ratio out of this package looks wrong, this is not the first thing to
suspect. Section 1 is.**

## 3. `epsilon_eff = (1 + epsilon_r)/2` is the package's own idealisation

The phase velocity used for a CPW comes from `qultra.constants.epsilon_r` through
`epsilon_eff = (1 + epsilon_r)/2`, the standard thin-film half-space estimate. On silicon that is
`epsilon_eff = 6.45` and `v = 1.18043 × 10⁸ m/s`.

It is an idealisation of a real coplanar waveguide, which has a finite centre-conductor width, a
gap, a metal thickness and a substrate of finite depth. **Any length the package hands back is
therefore a length in its own idealised medium**, and a layout tool will not agree with it. Quote
it as such, and do not treat a solved line length as fabrication-ready without a cross-section
calculation.

## 4. A mode leaving its search window surfaces as an error from inside the Jacobian

`QuLTRA` raises `No zeros found in the specified interval` when the `(fmin, fmax)` window it was
given contains no mode. In an outer solve — a Newton step, a bisection, a parameter sweep — that
arrives from three levels down, with no indication of which knob moved a mode out of which
window, and it reads as a puzzle rather than as a message.

The cause is nearly always a **fixed** window over a swept parameter. Two measured cases: over a
search on a shunt capacitance, that node's own resonance ran from 153 GHz down to 1.5, and over a
search on a line length the line's resonance left any window pinned near its design value.

**Scale every window and every bracket to its own target rather than to a design value**, and
where a solve takes a full Newton step into a region with no mode, halve the step and retry
rather than letting the raise escape. Both are cheaper than reading the traceback.

---

## What it publishes, and what that is good for

Worth knowing because it changes what is worth cross-checking. `run_epr` returns the
participation ratios **directly**, alongside the frequencies, the linewidths and the Kerr matrix.

Every Kerr is a function of the mode frequencies and `p` alone,

    alpha_i  = -f_i^2 p_i^2   / (8 EJ),
    chi_ij   = -f_i f_j p_i p_j / (4 EJ),

so comparing only the Kerrs against another tool checks the *output* of those formulas twice and
the *input* never. Because this package publishes `p`, a cross-check can compare the input as
well, which is the tighter test — in one measured three-way comparison against two other
quantisations of the same lumped circuit, the participations agreed to 7.4 × 10⁻⁵ while the worst
deviation on anything was 1.6 × 10⁻⁴.

It also takes the junction's linear inductance and **derives `EJ` from it** rather than accepting
both. That is the right way round: a tool given both can end up describing two different
junctions, and the signature when it happens is every Kerr off by one constant factor while every
frequency and linewidth is right.

## Sign convention

Kerrs come back **positive**, with the sign carried in the Hamiltonian. Anharmonicities and
dispersive shifts are negative for a transmon, so a table written signed has to negate them, and
one written unsigned has to say so.
