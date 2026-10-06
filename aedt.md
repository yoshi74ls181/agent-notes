# Driving Ansys AEDT from PyAEDT

How to script Ansys Electronics Desktop (AEDT) 2022 R2 through PyAEDT on Windows without hanging the session, corrupting a project, or trusting a number the solver did not earn.
It covers HFSS driven-modal and eigenmode, Q3D capacitance and Q2D work; energy-participation analysis is not recorded here yet.

## The interpreter

Run every AEDT, plotting and slide-deck script on the Python that ships with AEDT:

```powershell
$p = "C:\Program Files\AnsysEM\v222\Win64\commonfiles\CPython\3_7\winx64\Release\python\python.exe"
& $p "C:\path\to\script.py" ARG1 ARG2
```

It is CPython 3.7 and carries pyaedt 0.6.94, numpy, matplotlib 3.1.1, python-pptx 0.6.21 and pywin32.
Keep pyaedt below 0.7; the calls in this note are written against 0.6.94.
A system Python, or WSL's, has none of these packages, so even a script that only plots must use the bundled one.
From WSL, call the same executable under `/mnt/c/...` and pass script paths through `wslpath -w`.

The Windows console is cp1252, so `print()` of `Ω`, `µ`, `→` or `≲` raises `UnicodeEncodeError`.
Files are unaffected; encode console output with `.encode("ascii", "replace").decode()`.

## Launch once, then attach

AEDT runs as one graphical session that every script attaches to; rendering needs the GUI.
Launch it once and leave it running:

```python
import pyaedt
pyaedt.settings.use_grpc_api = False               # COM, not gRPC
from pyaedt import Desktop
d = Desktop(specified_version="2022.2", non_graphical=False,
            new_desktop_session=True, close_on_exit=False)
print("SESSION READY pid=%s" % d.odesktop.GetProcessID(), flush=True)
```

In 0.6.94, `d.release_desktop(close_projects=False, close_desktop=False)` may raise `unexpected keyword argument 'close_desktop'`; AEDT stays up regardless.

Every worker script attaches and never launches:

```python
import pyaedt
pyaedt.settings.use_grpc_api = False
from pyaedt import Hfss                              # or Q2d
hfss = Hfss(projectname=PROJECT, designname=DESIGN, solution_type="DrivenModal",
            specified_version="2022.2", new_desktop_session=False, close_on_exit=False)
...
hfss.save_project()
hfss.release_desktop(close_projects=False, close_desktop=False)   # leaves AEDT running
```

The process that owns a project is named in the `DesktopProcessID` line of the `*.aedt.lock` file beside it.

**Kill every `ansysedt.exe` before a fresh launch, not just one.**
Orphaned instances fight over the COM registration, and every COM call in the new session then fails instantly with `(-2147352567, 'Exception occurred.', (…, -2147024373), …)`.
That error repeating identically for every operation is a session fault, not a geometry fault.
To recover:

```powershell
taskkill /F /IM ansysedt.exe /IM HFSSCOMENGINE.exe /IM mpiexec.exe
(tasklist | Select-String -Pattern ansysedt).Count     # must be 0
Remove-Item *.aedt.lock
```

Then launch one session.
A batch should reuse one long-lived session rather than kill and relaunch per item.

## Project and design hygiene

- **Use a fresh design name for every run.**
  Re-inserting a 3D component into an existing design duplicates all its parts.
  Bump a version suffix per run, and key output file names by parameters so a re-run overwrites data while designs stay distinct.
- **Delete stale designs from a separate process**, since a script cannot delete the design it is attached to:

  ```python
  hfss = Hfss(projectname=PROJECT, specified_version="2022.2",
              new_desktop_session=False, close_on_exit=False)
  for n in ["OLD_DESIGN_1", "OLD_DESIGN_2"]:
      if n in hfss.design_list:
          hfss.oproject.DeleteDesign(n)
  hfss.save_project(); hfss.release_desktop(close_projects=False, close_desktop=False)
  ```

  Leave `ManagedFiles_*` and `mf_*` designs alone; they are 3D-component helpers that AEDT collects on save.
- **Give each heavy sub-study its own `.aedt` file.**
  A project that accumulates designs bloats to gigabytes and slows every operation.
- **A backup is the `.aedt` file and its `.aedtresults/` folder together.**
  The `.aedt` holds geometry and setup only; copied alone, it opens with the model intact and the results empty.
- **A project created from a bare name is saved in AEDT's default directory**, not the working directory.
  Call `hfss.save_project(r"C:\full\path\foo.aedt")` straight after creating it, and solve in the same session: re-opening a just-saved file is where the multi-instance COM errors appear.

## Geometry

- **`create_rectangle` takes its sizes in plane order**: `"XZ"` wants `[z_size, x_size]` and `"YZ"` wants `[y_size, z_size]`.
- **Validate before every solve.**
  The call `odesign.ValidateDesign()` returns 1 for valid and 0 for failed, and `Analyze` aborts on the same check with COM error `-2147352567`.
  On failure, `odesktop.GetMessages(project, design, 0)` names the offending objects.
  A design with no solution setup always fails validation, so create the setup before validating a build in stages.
- **Overlaps between natives of different materials resolve silently by priority**, the later-created object winning.
  A `unite` produces the newest object, so a united air box then overrides the substrate and wires inside it and validation reports them as intersecting.
  Subtract the interior solids from the united box with `keep_originals=True` so each fills its own void.
- **Overlaps between natives of the same material are errors**, including one PEC wire straddling the shared face of two stacked vacuum boxes.
  Unite the boxes.
- **Coincident faces are allowed and conduct.**
  A conductor that must touch another lands on its face, never inside it.
- **An object moved after it was subtracted from the air box no longer matches its void.**
  Re-subtract it.
- **Never land an air-box face on a measured surface.**
  "Non-manifold edges found for part X" means a face landed exactly on, or tangent to, another surface, leaving a nanometre sliver.
  Push the box 50–100 µm into the neighbouring metal and let the subtraction define the surface; where two boxes meet at a plane another part also uses, overlap them instead and carve the part once, from the union.

### Probing geometry without the GUI

- `oeditor.GetBodyNamesByPosition(["NAME:Parameters", "XPosition:=", "0mm", "YPosition:=", "0mm", "ZPosition:=", "0mm"])` returns the objects at a point.
  Walking it along an intended current path is the fastest way to find a break, and bisecting with it measures imported geometry.
- `GetVertexIDsFromObject` misses vertices on curved edges, so a bounding box from vertices under-estimates a disc.
  Recover a cylinder's radius from `GetFaceArea` and `GetFaceCenter`.
- `GetPropertyValue("Geometry3DAttributeTab", obj, "Material")` raises for a part of an encrypted 3D component, which makes it a reliable test for membership even though such parts appear in `modeler.object_names`.

## Encrypted 3D components

- Insert with `udc = m.insert_3d_component(path, password="<pw>")`; the component may bring its own ports.
- **Booleans, copies and subtractions on its parts are blocked, and so is any volumetric overlap with them.**
  Model the air as native `vacuum` solids instead; unmodelled space defaults to PEC, so the component's metal is represented by the absence of air.
  Carve keepouts from the air with native clones of the component metal.
- **Size keepouts exactly to the component metal, with no margin.**
  Any margin leaves an unmodelled PEC void that breaks galvanic contact between native conductors and the component.
  Measure the real faces with `GetVertexPosition` and `GetFaceCenter` rather than trusting nominal dimensions.
- **Build in the component's native frame.**
  The call `insert_3d_component` places it at the global origin, and rotating it perturbs its faces enough that native keepouts no longer carve it exactly.
- To extend a component conductor, add a native box coincident with its metal.
- To hide the component for a picture, delete the instance with `udc.delete()`; deleting its sub-part names does nothing.
- Turn off "Do Mesh Assembly" if the component sets it: `m.oeditor.GetChildObject("<CompName>1").SetPropValue("Do Mesh Assembly", False)`.

## Geometry imported from STEP

- **Get the air by subtracting the imported metal from bounding boxes**, then delete the metal.
  This reproduces machined pockets, chamfers and fillets that cannot be rebuilt from primitives.
  Bound the boxes at real walls so seams and the exterior are never included.
- **Model a bolted metal joint closed.**
  An open seam adds a spurious radial stub and a leak path to the boundary.
- **Never read a 2D pattern off an imported sheet.**
  The importer `import_3d_cad` heals coplanar faces, merging the gaps of an imprinted coplanar waveguide into their neighbours.
  Read the pattern from the STEP text instead.

## Long parameter sweeps

- **Reload a fresh copy of a saved base project at least every five geometry edits.**
  Boolean edits accumulate modeler history, and past a few dozen a boolean hangs with `ansysedt.exe` alive, no solver running and the log frozen.
- **Reload to a new file name each time**, and delete the previous copy after closing it.
  Copying over the open file's name races AEDT's file handle and fails with `-2147023170 'The remote procedure call failed'`.
- **Give recreated tool objects a unique name per iteration.**
  Consumed names stay reserved for the session, so a reused name is silently renamed and the next boolean fails; pyaedt masks the AEDT error as `ValueError: substring not found`.
- **Make every multi-solve loop resumable, and run it under a watchdog.**
  Append each result to a CSV as it completes, write the current item to an in-progress file before attempting it, and skip completed and blacklisted items on start.
  The watchdog watches the log's modification time; on a stall of ten minutes it blacklists the in-progress item, kills AEDT and relaunches the script.
- **Screen coarse, then refine generously.**
  Screen over the objective band only, then re-solve the top twenty candidates at tight settings: coarse adaptive meshes move results by more than the differences between candidates and can under-rank the optimum.

## Solving

- Insert setups and sweeps through the native modules: `od.GetModule("AnalysisSetup").InsertSetup("HfssDriven", [...])`, then `.InsertFrequencySweep("Setup", [...])`, and edit a sweep with `EditFrequencySweep(setup, sweep, [...])`.
- Solve with `hfss.analyze_setup(setup)`.
- The solver runs as parallel `hf3d` processes under `mpiexec`, separate from `ansysedt`.
  Judge progress by their CPU time and working set; the `ansysedt` CPU counter barely moves during a solve.
  Watch free memory: once the machine pages, the solve goes out of core and crawls.
- **To abort a solve, stop the driver and then the `hf3d` and `mpiexec` processes, leaving `ansysedt` alive.**
  Results from setups solved earlier survive and the session stays usable.

## Ports and S-parameters

- A wave port's `Zo(1)` reads 50 Ω while renormalisation is on; pass `renorm=False` to read the true impedance.
- Integration-line points must be numeric literals, not design-variable strings.
- A lumped port on an existing sheet, natively; `Start` is the reference edge and `End` the signal edge:

  ```python
  oModule.AssignLumpedPort(["NAME:P", "Objects:=", [sheet], "DoDeembed:=", False,
      "RenormalizeAllTerminals:=", True,
      ["NAME:Modes", ["NAME:Mode1", "ModeNum:=", 1, "UseIntLine:=", True,
          ["NAME:IntLine", "Start:=", ref_pt, "End:=", sig_pt],
          "CharImp:=", "Zpi", "RenormImp:=", "50ohm"]],
      "Impedance:=", "50ohm"])
  ```

- Read results with `sol = hfss.post.get_solution_data(expressions=["dB(S(P1,P1))", "dB(S(P2,P1))"], setup_sweep_name="Setup : Sweep")`, then `sol.primary_sweep_values` and `sol.data_real(expr)`.
  Ports are named by their bare excitation names, without `:1`.
- Export Touchstone with `oDesign.GetModule("Solutions").ExportNetworkData("", ["Setup:Sweep"], 3, "out.s2p", ["All"], True, 50, "out.cir", -1, 0, 1, True, True, False)`.

### Reading connectivity from S-parameters

- **S11 near 0 dB across the band, with S21 small and rising with frequency, is a galvanic open.**
  Find it with the point probe before suspecting the port.
- **S11 poor at low frequency and improving with frequency is a sub-micrometre gap acting as a series capacitor.**
  Metal that must touch a face has to reach its exact measured coordinate.

## HFSS eigenmode

- **Model a Josephson junction as a lumped inductor on a sheet across the barrier.**
  Put a planar sheet through the barrier with one edge on each electrode, and assign `assign_lumped_rlc_to_sheet(sheet, axisdir=[start, end], rlctype="Parallel", Lvalue=L)` with the integration line from one electrode to the other.
  Pass `Lvalue` as a number in henries; pyaedt appends `H` itself, so a string such as `"18.9nH"` becomes `18.9nHH`, which AEDT rejects in a message while the solve runs on without the inductor.
- **Converge only on the modes you need.**
  The criterion `MaxDeltaFreq` is taken over every requested mode, so an extra high mode that the mesh does not resolve keeps the criterion from ever settling.
- **Require a minimum pass count and several converged passes.**
  A coarse mesh can meet a loose criterion on two consecutive passes by chance; set `MinimumPasses` and `MinimumConvergedPasses` of at least 3 and check the convergence table.
- **Refine the faceting of any curved face whose area sets a capacitance.**
  HFSS meshes a circle as a polygon, at its default with about 16 sides and 2.5 % less area; assign `mesh.assign_surface_mesh_manual(objects, normal_dev="5deg")` to the junction electrodes and barrier.
- Read eigenfrequencies with `get_solution_data(expressions=["Mode(1)", ...], setup_sweep_name="Setup1 : LastAdaptive", report_category="Eigenmode Parameters")`, and export convergence with `export_convergence`.

## Q3D capacitance

- **Insert a capacitance-only setup natively.**
  A setup with DC or AC resistance-inductance blocks demands sources and sinks and fails the solve without them, and `create_setup` in 0.6.94 always adds both blocks.
  Insert the setup with only its `Cap` block:

  ```python
  q.odesign.GetModule("AnalysisSetup").InsertSetup("Matrix", [
      "NAME:Setup1", "AdaptiveFreq:=", "1GHz", "SaveFields:=", False, "Enabled:=", True,
      ["NAME:Cap", "MaxPass:=", 25, "MinPass:=", 1, "MinConvPass:=", 2, "PerError:=", 0.5,
       "PerRefine:=", 30, "AutoIncreaseSolutionOrder:=", True, "SolutionOrder:=", "High",
       "Solver Type:=", "Iterative"]])
  ```

- **Conductors that touch are one net.**
  The call `auto_identify_nets` groups conductors by contact, so two electrodes separated only by a thin dielectric must be separated by a modelled gap to stay separate nets; check `q.nets` against the conductors you expect before solving.
- **Build, set up, solve and read in one process.**
  After a script re-attaches, `get_setup` can return a setup with empty `props`.
- Read the matrix with `q.post.get_solution_data(expressions=["C(A,B)", ...], setup_sweep_name="Setup1 : LastAdaptive")`, and take each entry's unit from `sol.units_data`.
  The entries are the Maxwell matrix with the reference at infinity; deleting a conductor's row and column gives the matrix with that conductor grounded.
- **Export convergence natively for a natively inserted setup**: `q.odesign.ExportConvergence("Setup1", "", "CG", path, True)`.
  The pyaedt call `export_convergence` writes nothing for a setup it did not create.

## Q2D

- `from pyaedt import Q2d`, and set `q2d.xy_plane = True` before `create_region`.
- `assign_single_conductor(conductor_type="SignalLine")` for each signal; put every ground in one `"ReferenceGround"` call.
- Read the characteristic impedance with `q2d.post.get_solution_data(["Z0(sig,sig)"], "s1 : LastAdaptive", report_category="Matrix")`.

## Reading the numbers honestly

- **The interpolating sweep can emit one wild point at the bottom of the band.**
  Filter it on a physical criterion: below the frequency where a DC-connected structure is electrically small, S11 above −20 dB is an artifact.
- **Do not filter with a generic outlier or trend test**; a real sharp null or high-Q resonance is an isolated point too, and such a filter deletes it.
- **Compare in linear magnitude, not dB.**
  Inside a null or on a resonance skirt a few-MHz shift swings a dB difference by tens of dB while the reflected power barely moves.
- **Solve at two mesh frequencies and quote their agreement** alongside any number.
  Band edges and resonance frequencies are robust to the mesh; the depth of a deep null is not.
- **Check energy conservation.**
  With PEC metal and lossless dielectric, |S11|² + |S21|² must equal 1 to within 1 %.
- If a sweep is truncated, plot the curve only where its data exist and shade the missing region.

## Pictures

- `export_model_picture` needs the interactive GUI:

  ```python
  h.post.export_model_picture(full_name=path, orientation="trimetric", show_axis=True,
                              show_grid=False, show_ruler=False, width=1600, height=1050)
  ```

  Orientations are `trimetric`, `dimetric`, `isometric`, `right`, `left`, `top`, `bottom`, `front` and `back`; planar features read best from `right` or `top`.
- `FitAll()` fits every object regardless of transparency, so delete the bulky objects before zooming to a small feature.
- Setting visibility through `oeditor.ChangeProperty` errors; set `Object3d.transparency` (0 opaque to 1 clear) and `.color` instead.
- The closing `PyVista module is required` warning is harmless.

## Slide decks

Build with python-pptx and export a PDF through PowerPoint's COM interface, on the bundled Python:

```python
import win32com.client
app = win32com.client.Dispatch("PowerPoint.Application")
pres = app.Presentations.Open(PPTX_PATH, WithWindow=False)
pres.SaveAs(PDF_PATH, 32)   # 32 = ppSaveAsPDF
pres.Close(); app.Quit()
```

Verify a deck by reading its text back with python-pptx rather than by rasterising the PDF.
