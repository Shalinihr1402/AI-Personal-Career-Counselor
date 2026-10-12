import os
import sys
import json

# Ensure backend dir is in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(current_dir)
sys.path.insert(0, current_dir)

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

DATA_PATH = os.path.join(current_dir, "data", "onet_careers.json")

def run_regression_tests():
    print("=" * 80)
    print("RUNNING ETL REGRESSION & SKILL ATTRIBUTION TESTS")
    print("=" * 80)

    if not os.path.exists(DATA_PATH):
        print(f"FAIL: {DATA_PATH} not found.")
        return False

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        careers = json.load(f)

    careers_by_soc = {c["soc_code"]: c for c in careers}
    passed = 0
    total = 0

    # -------------------------------------------------------------------------
    # TEST 1: Musicians and Singers (SOC 27-2042.00)
    # -------------------------------------------------------------------------
    total += 1
    print("\n[TEST 1] Musicians and Singers (SOC 27-2042.00 - Arts, Design & Media)")
    mus = careers_by_soc.get("27-2042.00")
    if not mus:
        print("  FAIL: Career 27-2042.00 not found.")
    else:
        mus_skills = mus.get("skills", [])
        mus_tools = mus.get("software_tools", [])
        print(f"  skills: {mus_skills}")
        print(f"  software_tools: {mus_tools}")
        
        has_generic = any(t in mus_skills for t in ["SAP software", "Microsoft Word", "Microsoft Excel"])
        has_workplace = any(s in mus_skills for s in ["Speaking", "Active Listening", "Monitoring"])
        tools_preserved = len(mus_tools) > 0
        
        if not has_generic and has_workplace and tools_preserved:
            print("  PASS: Generic software removed from skills; pure workplace competencies present; software_tools preserved.")
            passed += 1
        else:
            print(f"  FAIL: has_generic={has_generic}, has_workplace={has_workplace}, tools_preserved={tools_preserved}")

    # -------------------------------------------------------------------------
    # TEST 2: Second Creative Career: Fashion Designers (SOC 27-1022.00)
    # -------------------------------------------------------------------------
    total += 1
    print("\n[TEST 2] Fashion Designers (SOC 27-1022.00 - Arts, Design & Media)")
    fashion = careers_by_soc.get("27-1022.00")
    if not fashion:
        print("  FAIL: Career 27-1022.00 not found.")
    else:
        f_skills = fashion.get("skills", [])
        f_tools = fashion.get("software_tools", [])
        print(f"  skills: {f_skills}")
        print(f"  software_tools: {f_tools[:6]}")
        
        # In the bug, skills had SAS and Trimble SketchUp Pro
        has_sas = "SAS" in f_skills
        # Software tools should now prioritize Adobe tools over SAS/SketchUp
        has_adobe = any("adobe" in t.lower() for t in f_tools[:4])
        
        if not has_sas and has_adobe:
            print("  PASS: Inverted SAS removed from skills; Adobe design tools properly prioritized in software_tools.")
            passed += 1
        else:
            print(f"  FAIL: has_sas={has_sas}, has_adobe={has_adobe}")

    # -------------------------------------------------------------------------
    # TEST 3: Healthcare Career: Registered Nurses (SOC 29-1141.00)
    # -------------------------------------------------------------------------
    total += 1
    print("\n[TEST 3] Registered Nurses (SOC 29-1141.00 - Healthcare & Medicine)")
    nurse = careers_by_soc.get("29-1141.00")
    if not nurse:
        print("  FAIL: Career 29-1141.00 not found.")
    else:
        n_skills = nurse.get("skills", [])
        n_tools = nurse.get("software_tools", [])
        print(f"  skills: {n_skills}")
        print(f"  software_tools: {n_tools}")
        
        has_word = "Microsoft Word" in n_skills
        has_clinical = any(s in n_skills for s in ["Social Perceptiveness", "Active Listening", "Coordination", "Speaking"])
        
        if not has_word and has_clinical:
            print("  PASS: Microsoft Word removed from clinical skills; healthcare workplace competencies preserved.")
            passed += 1
        else:
            print(f"  FAIL: has_word={has_word}, has_clinical={has_clinical}")

    # -------------------------------------------------------------------------
    # TEST 4: Education Career: Kindergarten Teachers (SOC 25-2012.00)
    # -------------------------------------------------------------------------
    total += 1
    print("\n[TEST 4] Kindergarten Teachers (SOC 25-2012.00 - Education & Training)")
    teacher = careers_by_soc.get("25-2012.00")
    if not teacher:
        print("  FAIL: Career 25-2012.00 not found.")
    else:
        t_skills = teacher.get("skills", [])
        print(f"  skills: {t_skills}")
        
        has_word = "Microsoft Word" in t_skills
        has_teaching = any(s in t_skills for s in ["Instructing", "Learning Strategies", "Speaking", "Active Listening"])
        
        if not has_word and has_teaching:
            print("  PASS: Microsoft Word removed from teacher skills; pedagogical skills preserved.")
            passed += 1
        else:
            print(f"  FAIL: has_word={has_word}, has_teaching={has_teaching}")

    # -------------------------------------------------------------------------
    # TEST 5: Technology Career: Software Developers (SOC 15-1252.00)
    # -------------------------------------------------------------------------
    total += 1
    print("\n[TEST 5] Software Developers (SOC 15-1252.00 - Technology & Computer Science)")
    dev = careers_by_soc.get("15-1252.00")
    if not dev:
        print("  FAIL: Career 15-1252.00 not found.")
    else:
        d_skills = dev.get("skills", [])
        d_tools = dev.get("software_tools", [])
        print(f"  skills: {d_skills}")
        print(f"  software_tools: {d_tools[:6]}")
        
        # Technology careers combine software tools and workplace skills
        has_tech_tools = len(d_tools) > 0
        has_workplace = any(s in d_skills for s in ["Critical Thinking", "Reading Comprehension", "Complex Problem Solving"])
        
        if has_tech_tools and has_workplace:
            print("  PASS: Technology career retains software tools alongside workplace skills.")
            passed += 1
        else:
            print(f"  FAIL: has_tech_tools={has_tech_tools}, has_workplace={has_workplace}")

    # -------------------------------------------------------------------------
    # TEST 6: Data & AI Career: Data Scientists (SOC 15-2051.00)
    # -------------------------------------------------------------------------
    total += 1
    print("\n[TEST 6] Data Scientists (SOC 15-2051.00 - Data & AI)")
    ds = careers_by_soc.get("15-2051.00")
    if not ds:
        print("  FAIL: Career 15-2051.00 not found.")
    else:
        ds_skills = ds.get("skills", [])
        ds_tools = ds.get("software_tools", [])
        print(f"  skills: {ds_skills}")
        print(f"  software_tools: {ds_tools[:6]}")
        
        if len(ds_skills) >= 4 and len(ds_tools) > 0:
            print("  PASS: Data & AI career maintains technical skills and software tools.")
            passed += 1
        else:
            print(f"  FAIL: ds_skills={ds_skills}")

    # -------------------------------------------------------------------------
    # TEST 7: Enterprise Occupation: Industrial Production Managers (SOC 11-3051.00)
    # -------------------------------------------------------------------------
    total += 1
    print("\n[TEST 7] Industrial Production Managers (SOC 11-3051.00 - Enterprise Tool Relevance)")
    mgr = careers_by_soc.get("11-3051.00")
    if not mgr:
        print("  FAIL: Career 11-3051.00 not found.")
    else:
        m_skills = mgr.get("skills", [])
        m_tools = mgr.get("software_tools", [])
        print(f"  skills: {m_skills}")
        print(f"  software_tools: {m_tools}")
        
        # SAP should be preserved in software_tools where genuine enterprise tools apply
        has_sap_in_tools = any("sap" in t.lower() for t in m_tools)
        has_management_skills = any(s in m_skills for s in ["Management of Personnel Resources", "Monitoring", "Speaking", "Critical Thinking", "Coordination", "Time Management"])
        
        if has_sap_in_tools and has_management_skills:
            print("  PASS: SAP preserved in software_tools for industrial production management; management skills clean.")
            passed += 1
        else:
            print(f"  FAIL: has_sap_in_tools={has_sap_in_tools}, has_management_skills={has_management_skills}")

    print("\n" + "=" * 80)
    print(f"TOTAL TESTS: {passed}/{total} PASSED ({int(passed/total*100)}%)")
    print("=" * 80)
    return passed == total

if __name__ == "__main__":
    success = run_regression_tests()
    sys.exit(0 if success else 1)
