# Define all hardcoded local variable and local variables looked up from data resources
locals {
  stack_name                = "filing-close" # this must match the stack name the service deploys into
  name_prefix               = "${local.stack_name}-${var.environment}"
  service_name              = "dissolution-web-poc"
  container_port            = "3000" # default node port required here until prod docker container is built allowing port change via env var
  docker_repo               = "dissolution-web-poc"
  lb_listener_rule_priority = 20
  lb_listener_paths         = ["/close-a-company","/close-a-company/","/close-a-company/*"]
  healthcheck_path          = "/close-a-company/" #healthcheck path for dissolution web
  healthcheck_matcher       = "200"

  kms_alias                 = "alias/${var.aws_profile}/environment-services-kms"
  service_secrets           = jsondecode(data.vault_generic_secret.service_secrets.data_json)

  parameter_store_secrets    = {
    "vpc_name"                  = local.vpc_name
    "cache_password"            = local.cache_password
    "chs_api_key"               = local.chs_api_key
    "internal_api_url"          = local.internal_api_url
    "oauth2_auth_uri"           = local.oauth2_auth_uri
    "oauth2_redirect_uri"       = local.oauth2_redirect_uri
    "account_url"               = local.account_url
    "cache_server"              = local.cache_server
    "oauth2_client_id"          = local.oauth2_client_id
    "oauth2_client_secret"      = local.oauth2_client_secret
    "payments_api_url"          = local.payments_api_url
    "oauth2_request_key"        = local.oauth2_request_key
  }

  vpc_name                  = local.service_secrets["vpc_name"]
  cache_password            = local.service_secrets["cache_password"]
  chs_api_key               = local.service_secrets["chs_api_key"]
  internal_api_url          = local.service_secrets["internal_api_url"]
  oauth2_auth_uri           = local.service_secrets["oauth2_auth_uri"]
  oauth2_redirect_uri       = local.service_secrets["oauth2_redirect_uri"]
  account_url               = local.service_secrets["account_url"]
  cache_server              = local.service_secrets["cache_server"]
  oauth2_client_id          = local.service_secrets["oauth2_client_id"]
  oauth2_client_secret      = local.service_secrets["oauth2_client_secret"]
  payments_api_url          = local.service_secrets["payments_api_url"]
  oauth2_request_key        = local.service_secrets["oauth2_request_key"]

  # create a map of secret name => secret arn to pass into ecs service module
  # using the trimprefix function to remove the prefixed path from the secret name
  secrets_arn_map = {
    for sec in data.aws_ssm_parameter.secret:
      trimprefix(sec.name, "/${local.name_prefix}/") => sec.arn
  }

  service_secrets_arn_map = {
    for sec in module.secrets.secrets:
      trimprefix(sec.name, "/${local.service_name}-${var.environment}/") => sec.arn
  }

  # TODO: task_secrets don't seem to correspond with 'parameter_store_secrets'. What is the difference?
  task_secrets = [
    { "name": "COOKIE_SECRET", "valueFrom": "${local.secrets_arn_map.web-oauth2-cookie-secret}" },
    { "name": "CHS_API_KEY", "valueFrom": "${local.service_secrets_arn_map.chs_api_key}" },
    { "name": "CACHE_PASSWORD", "valueFrom": "${local.service_secrets_arn_map.cache_password}" },
    { "name": "CACHE_SERVER", "valueFrom": "${local.service_secrets_arn_map.cache_server}" },
    { "name": "OAUTH2_CLIENT_ID", "valueFrom": "${local.service_secrets_arn_map.oauth2_client_id}" },  
    { "name": "OAUTH2_CLIENT_SECRET", "valueFrom": "${local.service_secrets_arn_map.oauth2_client_secret}" },
    { "name": "OAUTH2_REQUEST_KEY", "valueFrom": "${local.service_secrets_arn_map.oauth2_request_key}" },
    { "name": "ACCOUNT_URL", "valueFrom": "${local.service_secrets_arn_map.account_url}" },
    { "name": "INTERNAL_API_URL", "valueFrom": "${local.service_secrets_arn_map.internal_api_url}" },
    { "name": "PAYMENTS_API_URL", "valueFrom": "${local.service_secrets_arn_map.payments_api_url}" }
  ]

  task_environment = [
    { "name": "NODE_PORT", "value": "${local.container_port}" },
    { "name": "LOG_LEVEL", "value": "${var.log_level}" },
    { "name": "CHS_URL", "value": "${var.chs_url}" },
    { "name": "PIWIK_URL", "value": "${var.piwik_url}" },
    { "name": "PIWIK_SITE_ID", "value": "${var.piwik_site_id}" },
    { "name": "CACHE_DB", "value": "${var.cache_db}" },
    { "name": "CDN_HOST", "value": "${var.cdn_host}" },
    { "name": "CHIPS_PRESENTER_AUTH_URL", "value": "${var.chips_presenter_auth_url}" },
    { "name": "CHS_COMPANY_PROFILE_API_LOCAL_URL", "value": "${var.chs_company_profile_api_local_url}" },
    { "name": "COOKIE_DOMAIN", "value": "${var.cookie_domain}" },
    { "name": "COOKIE_NAME", "value": "${var.cookie_name}" },
    { "name": "COOKIE_SECURE_ONLY", "value": "${var.cookie_secure_only}" },
    { "name": "DEFAULT_SESSION_EXPIRATION", "value": "${var.default_session_expiration}" }, # TODO Is this needed?
    { "name": "DISSOLUTIONS_API_URL", "value": "${var.dissolutions_api_url}" },
    { "name": "ENV_REGION_AWS", "value": "${var.aws_region}" },
    { "name": "HUMAN_LOG", "value": "${var.human_log}" },
    { "name": "PAY_BY_ACCOUNT_FEATURE_ENABLED", "value": "${var.pay_by_account_feature_enabled}" },
    { "name": "PIWIK_CONFIRMATION_PAGE_PDF_GOAL_ID", "value": "${var.piwik_confirmation_page_pdf_goal_id}" },
    { "name": "PIWIK_LANDING_PAGE_START_GOAL_ID", "value": "${var.piwik_landing_page_start_goal_id}" },
    { "name": "PIWIK_LIMITED_COMPANY_GOAL_ID", "value": "${var.piwik_limited_company_goal_id}" },
    { "name": "PIWIK_PARTNERSHIP_GOAL_ID", "value": "${var.piwik_partnership_goal_id}" },
    { "name": "PIWIK_SINGLE_DIRECTOR_CONFIRMATION_GOAL_ID", "value": "${var.piwik_single_director_confirmation_goal_id}" },
    { "name": "PIWIK_MULTI_DIRECTOR_CONFIRMATION_GOAL_ID", "value": "${var.piwik_multi_director_confirmation_goal_id}" },
    { "name": "PIWIK_LIMITED_COMPANY_CONFIRMATION_GOAL_ID", "value": "${var.piwik_limited_company_confirmation_goal_id}" },
    { "name": "PIWIK_PARTNERSHIP_CONFIRMATION_GOAL_ID", "value": "${var.piwik_partnership_confirmation_goal_id}" },
    { "name": "API_URL", "value": "${var.api_url}" }
  ]
}
