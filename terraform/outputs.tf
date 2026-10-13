output "vpc_id" {
  description = "ID of the project VPC"
  value       = aws_vpc.main.id
}
