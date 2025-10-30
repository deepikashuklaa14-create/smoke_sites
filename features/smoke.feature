Feature: Smoke test multiple sites and pages

  @smoke
  Scenario Outline: Smoke all pages of a site and generate report
    Given I open "<siteName>" homepage
    Then I run smoke tests for "<siteName>"
    Then I click all links and save results to Excel report

  Examples:
    | siteName                    |
    | https://www.lsbf.edu.sg/    |
    # | https://www.torontosom.ca/  |
  
