Feature: Smoke test multiple sites and pages

  Scenario Outline: Smoke all pages of a site
    Given I open "<siteName>" homepage
    Then I run smoke tests for "<siteName>"

  Examples:
    | siteName               |
    | https://www.lsbf.edu.sg/ |
