import * as cdk from 'aws-cdk-lib';
import * as blueprints from '@aws-quickstart/eks-blueprints'
import { Construct } from 'constructs';

export default class ClusterConstruct extends Construct {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id);
    
    const account = props?.env?.account;
    const region = props?.env?.region;
    
    const blueprint = blueprints.EksBlueprint
                      .builder()
                      .account(account)
                      .region(region)
                      .addOns()
                      .teams()
                      .build(scope, id+"-stack");
    
  }
}
