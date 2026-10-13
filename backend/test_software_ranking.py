"""
test_software_ranking.py

Comprehensive Regression & Edge Case Test Suite for Occupation-Aware Software Tool Ranking:
1. Domain Alignment Accuracy (Unit Tests on is_domain_aligned):
   - Focused positive tests for all key career domains.
   - Focused negative tests to prevent false domain matches (e.g. description substring bleed,
     universal utilities, or broad prefix wildcards).
2. Edge Cases (Unit Tests on rank_software_tools_for_occupation):
   - Candidate row aggregation: duplicate rows where a later row has stronger evidence.
   - Zero In Demand tools.
   - Zero Hot Technology tools.
   - Duplicate tool names across different element categories.
   - Fewer than 6 available tools.
   - In-demand ubiquitous tools (e.g. Excel for Production Manager retains high priority, exempt from penalty).
   - Empty candidates list.
3. Occupational Tool Relevance & Ordering (Integration Tests on onet_careers.json):
   - Musicians and Singers (SOC 27-2042.00): Music production workstations lead; Facebook/SAP/Word do not crowd them out.
   - Registered Nurses (SOC 29-1141.00): Clinical EHR systems lead; Apache Spark does not crowd them out.
   - Kindergarten Teachers (SOC 25-2012.00): Educational software prioritized; office tools fill remaining slots cleanly.
   - Software Developers (SOC 15-1252.00): In-demand development tools lead; skills blend tech and workplace competencies.
   - Data Scientists (SOC 15-2051.00): Cloud, analytics, and ML frameworks lead.
   - Industrial Production Managers (SOC 11-3051.00): SAP ERP leads; in-demand enterprise/office tools preserved without blacklists.
"""

import os
import sys
import json
from pathlib import Path

current_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(current_dir)
sys.path.insert(0, current_dir)

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Import ranking logic directly from setup_onet
from scripts.setup_onet import rank_software_tools_for_occupation, is_domain_aligned, UBIQUITOUS_TOOL_THRESHOLD

DATA_PATH = Path(current_dir) / "data" / "onet_careers.json"


def test_domain_alignment_accuracy():
    print("=" * 80)
    print("RUNNING UNIT TESTS: DOMAIN ALIGNMENT ACCURACY (POSITIVE & NEGATIVE)")
    print("=" * 80)
    passed = 0
    total = 0

    # -------------------------------------------------------------------------
    # POSITIVE TESTS
    # -------------------------------------------------------------------------
    positive_cases = [
        ("Nurse + Medical Software", "2.E.9.i", "Medical software", "Healthcare & Medicine", "Registered Nurses"),
        ("Musician + Sound Editing", "2.E.3.b", "Music or sound editing software", "Arts, Design & Media", "Musicians and Singers"),
        ("Teacher + Computer Training", "2.E.8.b", "Computer based training software", "Education & Training", "Kindergarten Teachers"),
        ("Teacher + Educational Software", "2.E.8.e", "Multi-media educational software", "Education & Training", "Kindergarten Teachers"),
        ("Developer + Dev Environment", "2.E.7.b", "Development environment software", "Technology & Computer Science", "Software Developers"),
        ("Developer + DBMS", "2.E.6.d", "Data base management system software", "Technology & Computer Science", "Software Developers"),
        ("Data Scientist + Scientific", "2.E.9.d", "Analytical or scientific software", "Data & AI", "Data Scientists"),
        ("Data Scientist + BI", "2.E.6.m", "Business intelligence and data analysis software", "Data & AI", "Data Scientists"),
        ("Production Mgr + ERP", "2.E.2.b", "Enterprise resource planning ERP software", "Business, Management & Finance", "Industrial Production Managers"),
        ("Production Mgr + Industrial Control", "2.E.9.g", "Industrial control software", "Business, Management & Finance", "Industrial Production Managers"),
    ]

    print("\n--- Positive Alignment Cases ---")
    for name, eid, ename, field, title in positive_cases:
        total += 1
        res = is_domain_aligned(eid, ename, field, title)
        if res is True:
            print(f"  PASS: {name} correctly identified as domain-aligned.")
            passed += 1
        else:
            print(f"  FAIL: {name} was expected to be domain-aligned, got False.")

    # -------------------------------------------------------------------------
    # NEGATIVE TESTS (Detect & Prevent False Domain Matches)
    # -------------------------------------------------------------------------
    negative_cases = [
        ("Nurse + Dev Environment (No desc bleed)", "2.E.7.b", "Development environment software", "Healthcare & Medicine", "Registered Nurses"),
        ("Nurse + Business Intelligence / Spark", "2.E.6.m", "Business intelligence and data analysis software", "Healthcare & Medicine", "Registered Nurses"),
        ("Teacher + Route Navigation (Prefix leak)", "2.E.8.d", "Route navigation software", "Education & Training", "Kindergarten Teachers"),
        ("Teacher + Word Processing (Utility)", "2.E.4.d", "Word processing software", "Education & Training", "Kindergarten Teachers"),
        ("Musician + Spreadsheet (Utility)", "2.E.4.i", "Spreadsheet software", "Arts, Design & Media", "Musicians and Singers"),
        ("Musician + Office Suite (Utility)", "2.E.1.k", "Office suite software", "Arts, Design & Media", "Musicians and Singers"),
        ("Production Mgr + Sound Editing", "2.E.3.b", "Music or sound editing software", "Business, Management & Finance", "Industrial Production Managers"),
        ("General + Web Browser (Utility)", "2.E.10.e", "Internet browser software", "General", "General Office Clerk"),
        ("Developer + Email Software (Utility)", "2.E.16.a", "Electronic mail software", "Technology & Computer Science", "Software Developers"),
        ("Accountant + Presentation Software (Utility)", "2.E.4.f", "Presentation software", "Business, Management & Finance", "Accountants and Auditors"),
    ]

    print("\n--- Negative Alignment Cases (False Match Prevention) ---")
    for name, eid, ename, field, title in negative_cases:
        total += 1
        res = is_domain_aligned(eid, ename, field, title)
        if res is False:
            print(f"  PASS: {name} correctly rejected from domain alignment.")
            passed += 1
        else:
            print(f"  FAIL: {name} falsely matched as domain-aligned!")

    print("\n" + "-" * 80)
    print(f"DOMAIN ALIGNMENT TESTS: {passed}/{total} PASSED")
    print("-" * 80)
    return passed == total


def test_edge_cases():
    print("\n" + "=" * 80)
    print("RUNNING UNIT TESTS: EDGE CASES IN SOFTWARE TOOL RANKING")
    print("=" * 80)
    passed = 0
    total = 0

    dummy_tool_counts = {
        "Microsoft Excel": 859,
        "Microsoft Word": 784,
        "Specialized Audio Tool": 5,
        "Specialized Clinical Tool": 12,
        "Rare Custom Tool": 2,
        "MultiRowTool": 10,
        "CompetitorTool": 10
    }

    # Edge Case 1: Empty candidates
    total += 1
    print("\n[Edge Case 1] Empty Candidate List")
    res = rank_software_tools_for_occupation(
        candidates=[],
        field="General",
        title="General Role",
        desc="General Description",
        tool_soc_counts=dummy_tool_counts,
        max_tools=6
    )
    if res == []:
        print("  PASS: Empty candidates returns empty list []")
        passed += 1
    else:
        print(f"  FAIL: Expected [], got {res}")

    # Edge Case 2: Zero In Demand tools
    total += 1
    print("\n[Edge Case 2] Zero In Demand Tools (Domain Alignment vs Hot Ubiquitous)")
    candidates = [
        {"tool": "Microsoft Word", "eid": "2.E.4.d", "ename": "Word processing software", "is_hot": True, "is_demand": False},
        {"tool": "Specialized Audio Tool", "eid": "2.E.3.b", "ename": "Music or sound editing software", "is_hot": False, "is_demand": False},
    ]
    res = rank_software_tools_for_occupation(
        candidates=candidates,
        field="Arts, Design & Media",
        title="Musicians and Singers",
        desc="Sound and music recording",
        tool_soc_counts=dummy_tool_counts,
        max_tools=6
    )
    if res == ["Specialized Audio Tool", "Microsoft Word"]:
        print("  PASS: Domain-aligned tool (+3.0) ranked ahead of hot ubiquitous tool (-1.0) when In Demand is absent.")
        passed += 1
    else:
        print(f"  FAIL: Expected Specialized Audio Tool first, got {res}")

    # Edge Case 3: Zero Hot Technology tools
    total += 1
    print("\n[Edge Case 3] Zero Hot Technology Tools")
    candidates = [
        {"tool": "Standard Generic Tool", "eid": "2.E.10.e", "ename": "Internet browser software", "is_hot": False, "is_demand": False},
        {"tool": "Specialized Clinical Tool", "eid": "2.E.9.i", "ename": "Medical software", "is_hot": False, "is_demand": False},
    ]
    res = rank_software_tools_for_occupation(
        candidates=candidates,
        field="Healthcare & Medicine",
        title="Registered Nurses",
        desc="Medical patient care",
        tool_soc_counts=dummy_tool_counts,
        max_tools=6
    )
    if res == ["Specialized Clinical Tool", "Standard Generic Tool"]:
        print("  PASS: Domain-aligned tool correctly ranked first without requiring Hot Technology flag.")
        passed += 1
    else:
        print(f"  FAIL: Expected Specialized Clinical Tool first, got {res}")

    # Edge Case 4: Multi-Row Candidate Aggregation (Later row has stronger evidence)
    total += 1
    print("\n[Edge Case 4] Multi-Row Candidate Aggregation (Stronger Later Row)")
    candidates = [
        # Row 1 of MultiRowTool: weak evidence (no demand, no hot, general utility element) -> score 0.0
        {"tool": "MultiRowTool", "eid": "2.E.1.a", "ename": "Helpdesk software", "is_hot": False, "is_demand": False, "order": 0},
        # CompetitorTool: medium evidence (hot + domain aligned) -> score 1.0 + 3.0 = +4.0
        {"tool": "CompetitorTool", "eid": "2.E.7.b", "ename": "Development environment software", "is_hot": True, "is_demand": False, "order": 5},
        # Row 2 of MultiRowTool: strong evidence (in-demand + hot + domain aligned) -> score 4.0 + 1.0 + 3.0 = +8.0
        {"tool": "MultiRowTool", "eid": "2.E.7.b", "ename": "Development environment software", "is_hot": True, "is_demand": True, "order": 10},
    ]
    res = rank_software_tools_for_occupation(
        candidates=candidates,
        field="Technology & Computer Science",
        title="Software Developers",
        desc="Software development",
        tool_soc_counts=dummy_tool_counts,
        max_tools=6
    )
    if res == ["MultiRowTool", "CompetitorTool"]:
        print("  PASS: MultiRowTool aggregated Row 2's stronger evidence (+8.0) and ranked ahead of CompetitorTool (+4.0).")
        passed += 1
    else:
        print(f"  FAIL: Aggregation failed! Expected ['MultiRowTool', 'CompetitorTool'], got {res}")

    # Edge Case 5: Fewer than 6 available tools
    total += 1
    print("\n[Edge Case 5] Fewer Than Six Available Tools (e.g. 3 tools)")
    candidates = [
        {"tool": "Tool 1", "eid": "2.E.1.a", "ename": "General software", "is_hot": False, "is_demand": False},
        {"tool": "Tool 2", "eid": "2.E.1.a", "ename": "General software", "is_hot": False, "is_demand": False},
        {"tool": "Tool 3", "eid": "2.E.1.a", "ename": "General software", "is_hot": False, "is_demand": False},
    ]
    res = rank_software_tools_for_occupation(
        candidates=candidates,
        field="General",
        title="General Role",
        desc="General Description",
        tool_soc_counts=dummy_tool_counts,
        max_tools=6
    )
    if len(res) == 3 and res == ["Tool 1", "Tool 2", "Tool 3"]:
        print("  PASS: Exactly 3 tools returned without padding or index error.")
        passed += 1
    else:
        print(f"  FAIL: Expected 3 tools, got {len(res)}: {res}")

    # Edge Case 6: In-Demand Ubiquitous Tool retains high priority (Exempt from penalty)
    total += 1
    print("\n[Edge Case 6] In-Demand Ubiquitous Tool Exemption (e.g. Excel in Production Management)")
    candidates = [
        # In-demand Excel: +4.0 (Demand) + 1.0 (Hot) = +5.0 (exempt from -2.0 ubiquity penalty)
        {"tool": "Microsoft Excel", "eid": "2.E.4.i", "ename": "Spreadsheet software", "is_hot": True, "is_demand": True},
        # Rare tool without demand or domain: 0.0
        {"tool": "Rare Custom Tool", "eid": "2.E.1.a", "ename": "Helpdesk software", "is_hot": False, "is_demand": False},
    ]
    res = rank_software_tools_for_occupation(
        candidates=candidates,
        field="Business, Management & Finance",
        title="Industrial Production Managers",
        desc="Industrial production planning",
        tool_soc_counts=dummy_tool_counts,
        max_tools=6
    )
    if res[0] == "Microsoft Excel":
        print("  PASS: In-demand Excel (+5.0) correctly prioritized; exempt from ubiquity penalty.")
        passed += 1
    else:
        print(f"  FAIL: Expected Microsoft Excel first, got {res}")

    print("\n" + "-" * 80)
    print(f"EDGE CASE TESTS: {passed}/{total} PASSED")
    print("-" * 80)
    return passed == total


def test_occupational_relevance():
    print("\n" + "=" * 80)
    print("RUNNING INTEGRATION TESTS: OCCUPATIONAL TOOL RELEVANCE & ORDERING")
    print("=" * 80)

    if not DATA_PATH.exists():
        print(f"FAIL: {DATA_PATH} not found. Run setup_onet.py first.")
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
    mus = careers_by_soc.get("27-2042.00", {})
    tools = mus.get("software_tools", [])
    skills = mus.get("skills", [])
    print(f"  software_tools: {tools}")
    print(f"  skills:         {skills}")

    has_audio_tools = any(t in tools for t in ["Acoustica Mixcraft", "Apple GarageBand", "Audacity", "Avid Technology Pro Tools", "iZotope Ozone", "Avid Technology Sibelius"])
    has_generic_crowding = any(t in tools for t in ["Facebook", "Microsoft Word", "SAP software"])
    clean_skills = not any(t in skills for t in ["Facebook", "SAP software", "Microsoft Word", "Microsoft Excel"])

    if has_audio_tools and not has_generic_crowding and clean_skills:
        print("  PASS: Music/audio workstations prioritized; Facebook/SAP/Word do not crowd out top 6; skills clean.")
        passed += 1
    else:
        print(f"  FAIL: has_audio_tools={has_audio_tools}, has_generic_crowding={has_generic_crowding}, clean_skills={clean_skills}")

    # -------------------------------------------------------------------------
    # TEST 2: Registered Nurses (SOC 29-1141.00)
    # -------------------------------------------------------------------------
    total += 1
    print("\n[TEST 2] Registered Nurses (SOC 29-1141.00 - Healthcare & Medicine)")
    nurse = careers_by_soc.get("29-1141.00", {})
    tools = nurse.get("software_tools", [])
    skills = nurse.get("skills", [])
    print(f"  software_tools: {tools}")
    print(f"  skills:         {skills}")

    ehr_tools = ["eClinicalWorks EHR software", "Epic Systems", "Henry Schein Dentrix", "MEDITECH software", "Allscripts healthcare automation software", "Allscripts Sunrise"]
    has_ehr_tools = sum(1 for t in tools if t in ehr_tools) >= 4
    spark_first = len(tools) > 0 and tools[0] == "Apache Spark"
    clean_skills = not any(t in skills for t in ["Microsoft Word", "Apache Spark", "Microsoft Excel"])

    if has_ehr_tools and not spark_first and clean_skills:
        print("  PASS: Clinical EHR systems lead top 6; Apache Spark relegated below healthcare systems; skills clean.")
        passed += 1
    else:
        print(f"  FAIL: has_ehr_tools={has_ehr_tools}, spark_first={spark_first}, clean_skills={clean_skills}")

    # -------------------------------------------------------------------------
    # TEST 3: Kindergarten Teachers (SOC 25-2012.00)
    # -------------------------------------------------------------------------
    total += 1
    print("\n[TEST 3] Kindergarten Teachers (SOC 25-2012.00 - Education & Training)")
    teacher = careers_by_soc.get("25-2012.00", {})
    tools = teacher.get("software_tools", [])
    skills = teacher.get("skills", [])
    print(f"  software_tools: {tools}")
    print(f"  skills:         {skills}")

    ed_tools = ["Children's educational software", "Padlet", "Seesaw", "Bloomz"]
    ed_indices = [tools.index(t) for t in ed_tools if t in tools]
    office_tools = [t for t in ["Microsoft Excel", "Microsoft Office software", "Microsoft Word"] if t in tools]
    office_indices = [tools.index(t) for t in office_tools]

    ed_leads = len(ed_indices) > 0 and (len(office_indices) == 0 or min(ed_indices) < min(office_indices))
    clean_skills = not any(t in skills for t in ["Microsoft Word", "Microsoft Excel"])

    if ed_leads and clean_skills:
        print("  PASS: Educational software prioritized ahead of office tools; remaining slots filled cleanly; skills clean.")
        passed += 1
    else:
        print(f"  FAIL: ed_leads={ed_leads}, clean_skills={clean_skills}")

    # -------------------------------------------------------------------------
    # TEST 4: Software Developers (SOC 15-1252.00)
    # -------------------------------------------------------------------------
    total += 1
    print("\n[TEST 4] Software Developers (SOC 15-1252.00 - Technology & Computer Science)")
    dev = careers_by_soc.get("15-1252.00", {})
    tools = dev.get("software_tools", [])
    skills = dev.get("skills", [])
    print(f"  software_tools: {tools}")
    print(f"  skills:         {skills}")

    has_dev_tools = any(t in tools for t in ["Amazon Web Services AWS software", "Apache Kafka", "Atlassian JIRA", "C", "C#", "C++", "Python", "Git"])
    has_combined_skills = len(skills) >= 5 and any(t in skills for t in ["Amazon Web Services AWS software", "Apache Kafka", "Atlassian JIRA"])

    if has_dev_tools and has_combined_skills:
        print("  PASS: Core tech development tools lead; skills blend software and workplace competencies.")
        passed += 1
    else:
        print(f"  FAIL: has_dev_tools={has_dev_tools}, has_combined_skills={has_combined_skills}")

    # -------------------------------------------------------------------------
    # TEST 5: Data Scientists (SOC 15-2051.00)
    # -------------------------------------------------------------------------
    total += 1
    print("\n[TEST 5] Data Scientists (SOC 15-2051.00 - Data & AI)")
    ds = careers_by_soc.get("15-2051.00", {})
    tools = ds.get("software_tools", [])
    skills = ds.get("skills", [])
    print(f"  software_tools: {tools}")
    print(f"  skills:         {skills}")

    has_analytics_tools = any(t in tools for t in ["Amazon Web Services AWS software", "Apache Hadoop", "Apache Spark", "Microsoft Azure software", "PyTorch", "SAS"])
    has_combined_skills = len(skills) >= 5 and any(t in skills for t in ["Amazon Web Services AWS software", "Apache Hadoop", "Apache Spark"])

    if has_analytics_tools and has_combined_skills:
        print("  PASS: Cloud, analytics, and ML frameworks lead software_tools; skills blend tech and quantitative competencies.")
        passed += 1
    else:
        print(f"  FAIL: has_analytics_tools={has_analytics_tools}, has_combined_skills={has_combined_skills}")

    # -------------------------------------------------------------------------
    # TEST 6: Industrial Production Managers (SOC 11-3051.00)
    # -------------------------------------------------------------------------
    total += 1
    print("\n[TEST 6] Industrial Production Managers (SOC 11-3051.00 - Enterprise Tool Relevance)")
    mgr = careers_by_soc.get("11-3051.00", {})
    tools = mgr.get("software_tools", [])
    skills = mgr.get("skills", [])
    print(f"  software_tools: {tools}")
    print(f"  skills:         {skills}")

    sap_first = len(tools) > 0 and "sap" in tools[0].lower()
    has_enterprise_tools = any(t in tools for t in ["Microsoft Excel", "Microsoft Office software", "Intuit QuickBooks"])
    clean_skills = not any(t in skills for t in ["SAP software", "Microsoft Excel", "Microsoft Word"])

    if sap_first and has_enterprise_tools and clean_skills:
        print("  PASS: SAP software ranks #1; in-demand enterprise/office tools follow legitimately; skills clean.")
        passed += 1
    else:
        print(f"  FAIL: sap_first={sap_first}, has_enterprise_tools={has_enterprise_tools}, clean_skills={clean_skills}")

    print("\n" + "=" * 80)
    print(f"OCCUPATIONAL RELEVANCE TESTS: {passed}/{total} PASSED")
    print("=" * 80)
    return passed == total


def main():
    align_ok = test_domain_alignment_accuracy()
    if not align_ok:
        print("\nDomain alignment tests failed.")
        sys.exit(1)

    unit_ok = test_edge_cases()
    if not unit_ok:
        print("\nUnit edge case tests failed.")
        sys.exit(1)

    integration_ok = test_occupational_relevance()
    if not integration_ok:
        sys.exit(1)

    print("\nALL OCCUPATION-AWARE SOFTWARE RANKING TESTS PASSED (100%)!")
    sys.exit(0)


if __name__ == "__main__":
    main()
