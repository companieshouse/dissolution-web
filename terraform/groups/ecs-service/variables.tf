# ------------------------------------------------------------------------------
# Environment
# ------------------------------------------------------------------------------
variable "environment" {
  type        = string
  description = "The environment name, defined in envrionments vars."
}
variable "aws_region" {
  default     = "eu-west-2"
  type        = string
  description = "The AWS region for deployment."
}
variable "aws_profile" {
  default     = "development-eu-west-2"
  type        = string
  description = "The AWS profile to use for deployment."
}
variable "kms_alias" {
  type        = string
}
# ------------------------------------------------------------------------------
# Terraform
# ------------------------------------------------------------------------------
variable "aws_bucket" {
  type        = string
  description = "The bucket used to store the current terraform state files"
}
variable "remote_state_bucket" {
  type        = string
  description = "Alternative bucket used to store the remote state files from ch-service-terraform"
}
variable "state_prefix" {
  type        = string
  description = "The bucket prefix used with the remote_state_bucket files."
}
variable "deploy_to" {
  type        = string
  description = "Bucket namespace used with remote_state_bucket and state_prefix."
}

# ------------------------------------------------------------------------------
# Docker Container
# ------------------------------------------------------------------------------
variable "docker_registry" {
  type        = string
  description = "The FQDN of the Docker registry."
}

# ------------------------------------------------------------------------------
# Service performance and scaling configs
# ------------------------------------------------------------------------------
variable "desired_task_count" {
  type = number
  description = "The desired ECS task count for this service"
  default = 1 # defaulted low for dev environments, override for production
}
variable "required_cpus" {
  type = number
  description = "The required cpu resource for this service. 1024 here is 1 vCPU"
  default = 128 # defaulted low for dev environments, override for production
}
variable "required_memory" {
  type = number
  description = "The required memory for this service"
  default = 256 # defaulted low for node service in dev environments, override for production
}
variable "use_fargate" {
  type        = bool
  description = "If true, sets the required capabilities for all containers in the task definition to use FARGATE, false uses EC2"
  default     = false
}
# ------------------------------------------------------------------------------
# Service environment variable configs
# ------------------------------------------------------------------------------
variable "log_level" {
  default     = "info"
  type        = string
  description = "The log level for services to use: trace, debug, info or error"
}

variable "chs_url" {
  type        = string
}
variable "cdn_host" {
  type        = string
}
variable "account_local_url" {
  type        = string
}
variable "dissolution_web_version" {
  type        = string
  description = "The version of the overseas entities web container to run."
}
variable "piwik_url" {
  type        = string
}
variable "piwik_site_id" {
  type        = string
}
variable "redirect_uri" {
  type        = string
  default     = "/"
}
variable "cache_db" {
  type        = string
  default     = "0"
}
variable "cache_pool_size" {
  type        = string
  default     = "8"
}
variable "chs_company_profile_api_local_url" {
  type        = string
}
variable "cookie_domain" {
  type        = string
}
variable "cookie_name" {
  type        = string
  default     = "__SID"
}
variable "cookie_secure_only" {
  type        = string
  default     = "0"
}
variable "default_session_expiration" {
  type        = string
  default     = "3600"
}
variable "dissolutions_api_url" {
  type        = string
}
variable "api_url" {
  type        = string
}
variable "piwik_confirmation_page_pdf_goal_id" {
  type        = string
}
variable "piwik_landing_page_start_goal_id" {
  type        = string
}
variable "piwik_limited_company_goal_id" {
  type        = string
}
variable "piwik_partnership_goal_id" {
  type        = string
}
variable "piwik_single_director_confirmation_goal_id" {
  type        = string
}
variable "piwik_multi_director_confirmation_goal_id" {
  type        = string
}
variable "piwik_limited_company_confirmation_goal_id" {
  type        = string
}
variable "piwik_partnership_confirmation_goal_id" {
  type        = string
}
variable "chips_presenter_auth_url" {
  type        = string
}
variable "human_log" {
  type        = string
}
variable "pay_by_account_feature_enabled" {
  type        = string
}